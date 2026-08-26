#!/usr/bin/env python3
"""FastAPI service for FLUX.2 Klein doodle generation and OpenAI evaluation."""

from __future__ import annotations

import argparse
import base64
import io
import logging
import os
import queue
import secrets
import threading
import time
from contextlib import asynccontextmanager, contextmanager
from enum import Enum
from pathlib import Path
from typing import Annotated, AsyncIterator, Callable, Iterator

import torch
from diffusers.utils import logging as diffusers_logging
from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    Header,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from openai import OpenAI, OpenAIError
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field

diffusers_logging.get_logger(
    "diffusers.quantizers.torchao.torchao_quantizer"
).setLevel(logging.ERROR)
logging.getLogger("bitsandbytes.backends.cpu.ops").setLevel(logging.ERROR)
logging.getLogger("torchao").setLevel(logging.ERROR)

from diffusers import (  # noqa: E402
    Flux2KleinPipeline,
    Flux2Transformer2DModel,
    TorchAoConfig,
)
from torchao.quantization import Float8WeightOnlyConfig  # noqa: E402
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from transformers.utils import logging as transformers_logging

diffusers_logging.disable_progress_bar()
transformers_logging.disable_progress_bar()


ROOT_DIR = Path(__file__).parent
MODEL_DIR = Path(
    os.getenv("FLUX2_KLEIN_MODEL_DIR", ROOT_DIR / "models" / "FLUX.2-klein-4B")
)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_EVALUATOR_MODEL = os.getenv(
    "OPENAI_EVALUATOR_MODEL",
    "gpt-5.6-luna",
).strip()
OPENAI_TIMEOUT_SECONDS = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "").strip()
ENABLE_DEMO = os.getenv("ENABLE_DEMO", "1").strip().lower() not in {
    "0",
    "false",
    "no",
    "off",
}

if ENABLE_DEMO:
    import gradio as gr

IMAGE_SIZE = 512
MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_INPUT_IMAGE_PIXELS = 25_000_000
INFERENCE_STEPS = 4
BASE_SEED = 0
QUEUE_MAX_SIZE = 32
GENERATION_BATCH_MAX_SIZE = max(
    1,
    min(int(os.getenv("GENERATION_BATCH_MAX_SIZE", "1")), 4),
)
GENERATION_BATCH_WAIT_SECONDS = max(
    0.0,
    float(os.getenv("GENERATION_BATCH_WAIT_MS", "35")) / 1000,
)
TORCH_COMPILE_MODE = os.getenv("TORCH_COMPILE_MODE", "default").strip()
REDRAW_REFERENCE_LATENT_SCALE = 0.005


class DoodleDifficulty(str, Enum):
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"


REDRAW_INFERENCE_STEPS = {
    DoodleDifficulty.EASY: 3,
    DoodleDifficulty.NORMAL: 2,
    DoodleDifficulty.HARD: 1,
}


DIFFICULTY_STYLE_PROMPTS = {
    DoodleDifficulty.EASY: (
        "BADLY DRAWN AMATEUR PARTY-GAME DOODLE. Shaky uneven freehand black lines, wonky "
        "circles, lopsided shapes, awkward proportions, clumsy stick-like limbs, dot features, "
        "accidental overlaps, incomplete contours, and messy color scribbles outside the "
        "lines on blank white. Obviously unpolished and drawn too quickly. No clean line art, "
        "smooth geometry, vector art, clip art, professional cartoon, shading, or cleanup."
    ),
    DoodleDifficulty.NORMAL: (
        "FIVE-SECOND LOW-LINE, LOW-COLOR PARTY-GAME DOODLE. Preserve recognizable object "
        "shapes; make it look rushed by OMITTING marks, not by replacing or badly deforming "
        "the requested objects. LINE BUDGET: draw each object with one shaky outer contour "
        "and only one essential identifying mark. Use one open loop for a round part and do "
        "not add repeated inner lines. Remove duplicate strokes, texture strokes, patterns, "
        "spokes, seams, shadows, and decoration. COLOR BUDGET: black lines plus exactly one "
        "rough accent color for the whole image. Leave most shapes white and unfilled; never "
        "fully color a large area. Use plain white background and generous empty space. No "
        "clean geometry, vector art, icons, correction, or cleanup. The subjects, action, and "
        "essential props stay guessable despite the missing detail."
    ),
    DoodleDifficulty.HARD: (
        "FIVE-SECOND BLIND-CONTOUR PARTY-GAME DOODLE drawn with a mouse in the non-dominant "
        "hand while barely looking at the canvas. Preserve the requested subjects, action, "
        "and essential props, but draw them with obvious human placement mistakes. "
        "DELIBERATELY MAKE IT CROOKED: tilt objects in slightly wrong "
        "directions, make left and right sides uneven, turn circles into lumpy open loops, put "
        "features a little off-center, and connect parts at awkward angles. Use badly asymmetric "
        "silhouettes, disconnected corners, mismatched sizes, and abruptly stopped strokes. "
        "LINE BUDGET: draw each rough contour in one pass and never trace over or reinforce it. "
        "Use only one identifying mark per object; no duplicate outlines, repeated inner lines, "
        "patterns, texture, spokes, seams, shadows, or "
        "decoration. COLOR BUDGET: black plus one sparse accent-color scribble for the whole "
        "image; leave almost everything white and unfilled. Plain white background. It must "
        "look like an uncorrected human attempt under a real timer, never clean minimal design, "
        "vector art, an icon, or a polished cartoon. Keep it crude but still guessable."
    ),
}

DIFFICULTY_DETAIL_PROMPTS = {
    DoodleDifficulty.EASY: (
        "CONTENT FIDELITY: HIGH. Keep every requested subject, action, relationship, prop, "
        "count, and color. Preserve distinctive features as crude symbols, while keeping the "
        "drawing skill just as low as the other difficulties."
    ),
    DoodleDifficulty.NORMAL: (
        "CONTENT FIDELITY: MEDIUM AND CLEARLY GUESSABLE. Every named main subject, the "
        "primary action or relationship, and every essential action prop must remain "
        "recognizable. Give each subject and essential prop one crude identifying feature. "
        "Omit requested colors, clothing details, small features, textures, background, and "
        "decoration. Make it harder through fewer lines and colors, never by deleting or "
        "replacing the answer's subjects, action, or essential props."
    ),
    DoodleDifficulty.HARD: (
        "CONTENT FIDELITY: LOW DETAIL BUT STILL GUESSABLE WITHIN A FEW SECONDS. Preserve "
        "the exact types of every main subject, the primary action or relationship, and every "
        "prop needed to understand that action. Give each subject and essential prop one crude "
        "identifying feature. Omit requested colors, clothing details, small features, textures, "
        "background, and decoration. Make it harder through poor drawing skill and missing fine "
        "detail, never by deleting or replacing the answer's subjects, action, or essential props."
    ),
}

DEFAULT_DIFFICULTY = DoodleDifficulty.NORMAL

IMAGE_OBSERVATION_PROMPT = """제시어를 모르는 상태에서 이 그림을 관찰하세요.
그림에 실제로 보이는 대상, 소품, 행동, 대상 사이의 관계만 한국어로 짧게 적으세요.
보이지 않는 행동이나 상황을 추측하지 말고, 확실하지 않은 것은 모호하다고 적으세요.
대상은 공룡, 버스, 우산처럼 누구나 아는 가장 일반적인 이름으로 부르세요. 세부 종,
전문 명칭, 고유명사는 확실하더라도 사용하지 마세요.
평가나 점수 없이 관찰 내용만 1~3문장으로 답하세요."""

EVALUATION_PROMPT = """당신은 그림 맞히기 파티게임의 채점자입니다.
아래 그림 관찰 결과가 제시어를 얼마나 정확하게 전달하는지 평가하세요.

관찰 결과에 실제로 적힌 대상, 행동, 관계, 특징만 제시어와 비교하세요. 관찰 결과에 없는
내용을 있다고 가정하지 마세요. 이미지는 의도적으로 단순한 낙서이므로 그림 실력, 선의
매끄러움, 미적 완성도는 평가하지 마세요.

한줄평 작성 규칙:
- 그림에서 잘 표현된 핵심 요소와 빠지거나 모호한 요소를 구체적으로 짚으세요.
- 그림에 보이지 않는 행동이나 관계를 정황만으로 추측하지 마세요. 두 대상이 가까이 있다는
  이유만으로 기다린다, 쫓는다, 싸운다 같은 행동을 만들어내지 마세요.
- 제시어 자체를 해석하거나 제시어를 소재로 별도의 농담, 풍자, 이야기를 만들지 마세요.
- 가볍고 자연스러운 게임 진행자 말투를 사용하세요.
- 플레이어나 그림 실력을 비하하지 마세요.
- "잘 표현됐습니다", "이해하기 쉽습니다"처럼 내용 없는 평가는 피하세요.
- "핵심 요소", "제시어와 일치", "명확하게 표현" 같은 심사 보고서 말투를 피하고 그림에
  보이는 것을 바로 말하세요.
- 대상은 세부 종이나 전문 명칭 대신 누구나 아는 일반적인 이름으로 부르세요.
- 자연스러운 대화처럼 "~네요", "~어요", "~군요" 중 하나로 끝내세요.
- 한 문장으로 짧게 작성하세요.

점수 기준:
- 90~100: 핵심 대상, 행동, 관계가 모두 명확함
- 70~89: 핵심 대상과 행동 또는 관계는 보이지만 일부 특징이 빠지거나 모호함
- 40~69: 핵심 대상은 보이지만 행동이나 관계가 다르거나 확인되지 않음
- 10~39: 대상이나 소품 하나 정도만 우연히 일치함
- 0~9: 핵심 대상, 행동, 관계가 모두 보이지 않음

반드시 지킬 채점 조건:
- 70점 이상은 핵심 대상과 핵심 행동 또는 관계가 그림에서 직접 확인될 때만 가능합니다.
- 제시어에 날씨, 색, 개수, 크기 같은 중요한 특징이 있는데 관찰 결과에 없다면 90점 이상을
  줄 수 없습니다.
- 핵심 요소가 전혀 없다고 판단했다면 반드시 0~9점을 주세요.
- 한줄평의 판단과 점수가 서로 모순되면 안 됩니다.

채점 예시:
- 관찰: "공룡 한 마리가 버스 옆에 서 있고 작은 우산을 들고 있다."
  제시어: "공룡이 자동차를 쫓아 달려간다."
  결과: {{"score": 45, "comment": "공룡과 탈것은 보이지만, 달리거나 쫓는 모습은 없네요."}}
- 관찰: "공룡 한 마리가 버스 옆에서 우산을 들고 있다."
  제시어: "피자를 머리에 올리고 자전거를 타는 펭귄"
  결과: {{"score": 0, "comment": "펭귄과 자전거, 피자가 모두 보이지 않아요."}}
- 관찰: "모자를 쓴 고양이가 나무 위에 앉아 있다."
  제시어: "모자를 쓰고 나무 위에 앉은 고양이"
  결과: {{"score": 98, "comment": "모자 쓴 고양이와 나무 위 자세까지 바로 보이네요."}}

마크다운, 코드 펜스, 추가 설명 없이 다음 구조의 JSON 객체 하나만 출력하세요.
{{"score": 0, "comment": "그림에 근거한 짧은 한국어 한줄평"}}

그림 관찰 결과: {observation}
제시어: {target}
"""

MODEL_LOCK = threading.Lock()
REQUEST_SLOTS = threading.BoundedSemaphore(QUEUE_MAX_SIZE)
PIPE: Flux2KleinPipeline | None = None
OPENAI_CLIENT: OpenAI | None = None
GENERATION_BATCHER: GenerationBatcher | None = None
LOGGER = logging.getLogger("uvicorn.error")


class NoisyDependencyLogFilter(logging.Filter):
    """Drop known harmless dependency messages that obscure service logs."""

    SUPPRESSED_PREFIXES = {
        "bitsandbytes.autograd._functions": "MatMul8bitLt: inputs will be cast",
        "bitsandbytes.backends.cpu.ops": "Failed to load CPU gemm_4bit_forward",
    }

    def filter(self, record: logging.LogRecord) -> bool:
        prefix = self.SUPPRESSED_PREFIXES.get(record.name)
        return prefix is None or not record.getMessage().startswith(prefix)


DEPENDENCY_LOG_FILTER = NoisyDependencyLogFilter()
for logger_name in DEPENDENCY_LOG_FILTER.SUPPRESSED_PREFIXES:
    logging.getLogger(logger_name).addFilter(DEPENDENCY_LOG_FILTER)


class GenerateRequest(BaseModel):
    prompt: str = Field(
        min_length=1,
        max_length=1000,
        description="A scene description in any supported language.",
        examples=["작은 부엌에서 라면을 끓이는 펭귄"],
    )
    difficulty: DoodleDifficulty = Field(
        default=DEFAULT_DIFFICULTY,
        description="Recognition difficulty controlled by redraw skill and detail.",
    )


class EvaluationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int = Field(ge=0, le=100)
    comment: str = Field(min_length=1, max_length=120)


def gib(value: int) -> float:
    return value / (1024**3)


def validate_model_files() -> None:
    if not MODEL_DIR.exists():
        raise RuntimeError(f"Model directory not found: {MODEL_DIR}")
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU is required")


def load_pipeline() -> Flux2KleinPipeline:
    """Load the text-to-image model once on the local GPU."""
    validate_model_files()

    LOGGER.info("Loading INT8 text encoder...")
    text_encoder = AutoModelForCausalLM.from_pretrained(
        MODEL_DIR / "text_encoder",
        quantization_config=BitsAndBytesConfig(load_in_8bit=True),
        dtype=torch.bfloat16,
        device_map={"": 0},
        local_files_only=True,
    )

    LOGGER.info("Loading FP8 FLUX.2 Klein transformer...")
    transformer = Flux2Transformer2DModel.from_pretrained(
        MODEL_DIR / "transformer",
        quantization_config=TorchAoConfig(Float8WeightOnlyConfig()),
        dtype=torch.bfloat16,
        local_files_only=True,
    )

    LOGGER.info("Loading FLUX.2 Klein 4B pipeline...")
    pipeline = Flux2KleinPipeline.from_pretrained(
        MODEL_DIR,
        text_encoder=text_encoder,
        transformer=transformer,
        dtype=torch.bfloat16,
        local_files_only=True,
    )
    pipeline.transformer.to("cuda")
    pipeline.vae.to("cuda")
    pipeline.transformer.eval()
    pipeline.vae.eval()
    pipeline.text_encoder.eval()
    pipeline.set_progress_bar_config(disable=True)

    if TORCH_COMPILE_MODE.lower() not in {"", "0", "none", "off", "false"}:
        LOGGER.info("Partially compiling FLUX transformer (%s)...", TORCH_COMPILE_MODE)
        pipeline.transformer = torch.compile(
            pipeline.transformer,
            mode=TORCH_COMPILE_MODE,
            fullgraph=False,
        )
    else:
        LOGGER.info("Torch compilation disabled")
    warmup_pipeline(pipeline)

    LOGGER.info(
        "Ready on %s (%.2f GiB reserved)",
        torch.cuda.get_device_name(0),
        gib(torch.cuda.memory_reserved()),
    )
    return pipeline


def load_openai_client() -> OpenAI | None:
    """Create the remote evaluator client without making a startup request."""
    if not OPENAI_API_KEY:
        LOGGER.warning("OpenAI evaluator disabled: OPENAI_API_KEY is not configured")
        return None

    LOGGER.info("OpenAI evaluator ready (%s)", OPENAI_EVALUATOR_MODEL)
    return OpenAI(
        api_key=OPENAI_API_KEY,
        timeout=OPENAI_TIMEOUT_SECONDS,
        max_retries=2,
    )


@torch.inference_mode()
def warmup_pipeline(pipeline: Flux2KleinPipeline) -> None:
    """Compile and cache fixed-size generation graphs for serving batch sizes."""
    warmup_sizes = [1]
    if GENERATION_BATCH_MAX_SIZE >= 2:
        warmup_sizes.append(2)
    if GENERATION_BATCH_MAX_SIZE >= 4:
        warmup_sizes.append(4)
    LOGGER.info(
        "Warming up the 512x512 stage 1 and redraw graphs (batches=%s)...",
        warmup_sizes,
    )
    started = time.perf_counter()

    for batch_size in warmup_sizes:
        prompts = ["A cat holds a small umbrella."] * batch_size
        stage_one = run_image_pipeline_batch(
            pipeline,
            prompt=prompts,
            width=IMAGE_SIZE,
            height=IMAGE_SIZE,
            num_inference_steps=INFERENCE_STEPS,
            guidance_scale=1.0,
            generator=seeded_generators(batch_size),
        )
        with aligned_batched_reference_conditioning(
            pipeline,
            REDRAW_REFERENCE_LATENT_SCALE,
        ):
            run_image_pipeline_batch(
                pipeline,
                image=stage_one,
                prompt=[
                    compose_redraw_prompt(prompt, DEFAULT_DIFFICULTY)
                    for prompt in prompts
                ],
                width=IMAGE_SIZE,
                height=IMAGE_SIZE,
                num_inference_steps=REDRAW_INFERENCE_STEPS[DEFAULT_DIFFICULTY],
                guidance_scale=1.0,
                generator=seeded_generators(batch_size),
            )
        torch.cuda.synchronize()
        LOGGER.info(
            "Warm-up batch %d complete (%.2fs elapsed)",
            batch_size,
            time.perf_counter() - started,
        )
    torch.cuda.synchronize()
    torch.cuda.reset_peak_memory_stats()
    LOGGER.info("Warm-up complete (%.2fs)", time.perf_counter() - started)


def get_pipeline() -> Flux2KleinPipeline:
    if PIPE is None:
        raise RuntimeError("Model pipeline has not been loaded")
    return PIPE


def get_openai_client() -> OpenAI:
    if OPENAI_CLIENT is None:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    return OPENAI_CLIENT


def normalize_prompt(prompt: str, *, label: str) -> str:
    prompt = (prompt or "").strip()
    if not prompt:
        raise ValueError(f"{label}를 입력해 주세요.")
    return prompt


def resolve_difficulty(value: DoodleDifficulty | str) -> DoodleDifficulty:
    """Validate API and Gradio difficulty values through one common path."""
    try:
        return DoodleDifficulty(value)
    except ValueError as exc:
        raise ValueError("낙서 난이도는 easy, normal, hard 중 하나여야 합니다.") from exc


def get_doodle_style_prompt(value: DoodleDifficulty | str) -> str:
    """Return the demo preview of the server-owned second-stage prompt."""
    return compose_redraw_prompt(
        "<사용자가 입력한 원문 제시어>",
        value,
    )


def compose_redraw_prompt(
    user_prompt: str,
    difficulty: DoodleDifficulty | str,
) -> str:
    """Apply one difficulty prompt to the unchanged user request in stage two."""
    user_prompt = normalize_prompt(user_prompt, label="사용자 입력 프롬프트")
    resolved_difficulty = resolve_difficulty(difficulty)
    style_prompt = DIFFICULTY_STYLE_PROMPTS[resolved_difficulty]
    skill_labels = {
        DoodleDifficulty.EASY: "a badly drawn amateur doodle",
        DoodleDifficulty.NORMAL: "a five-second low-line low-color doodle",
        DoodleDifficulty.HARD: "a five-second blind-contour scribble",
    }
    return (
        f"DRAW {skill_labels[resolved_difficulty]} OF THIS EXACT SCENE: {user_prompt}\n\n"
        f"CONTENT: {DIFFICULTY_DETAIL_PROMPTS[resolved_difficulty]}\n\n"
        f"STYLE PRIORITY: {style_prompt}"
    )


def image_data_url(image: Image.Image) -> str:
    """Encode a normalized image for an OpenAI Responses API image input."""
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True)
    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def evaluate_image(image: Image.Image, target: str) -> EvaluationResponse:
    """Observe an image without the target, then score the grounded observation."""
    target = normalize_prompt(target, label="제시어")
    client = get_openai_client()
    started = time.perf_counter()

    try:
        observation_response = client.responses.create(
            model=OPENAI_EVALUATOR_MODEL,
            instructions=IMAGE_OBSERVATION_PROMPT,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_image",
                            "image_url": image_data_url(image),
                            "detail": "high",
                        },
                        {
                            "type": "input_text",
                            "text": "그림에 실제로 보이는 내용만 관찰하세요.",
                        },
                    ],
                }
            ],
            max_output_tokens=256,
            reasoning={"effort": "none"},
            store=False,
        )
        observation = observation_response.output_text.strip()
        if not observation:
            raise RuntimeError("OpenAI evaluator returned an empty observation")

        scoring_response = client.responses.parse(
            model=OPENAI_EVALUATOR_MODEL,
            instructions=EVALUATION_PROMPT.format(
                observation=observation,
                target=target,
            ),
            input="관찰 결과와 제시어를 기준에 따라 채점하세요.",
            text_format=EvaluationResponse,
            max_output_tokens=512,
            reasoning={"effort": "none"},
            store=False,
        )
    except OpenAIError as exc:
        LOGGER.warning("OpenAI evaluator request failed: %s", type(exc).__name__)
        raise RuntimeError("OpenAI evaluation request failed") from exc

    result = scoring_response.output_parsed
    if result is None:
        raise RuntimeError("OpenAI evaluator returned no structured output")

    result = EvaluationResponse.model_validate(
        {
            "score": result.score,
            "comment": " ".join(result.comment.split()),
        }
    )
    LOGGER.info(
        "평가 완료 · %.2f초 · %d점 · %s",
        time.perf_counter() - started,
        result.score,
        OPENAI_EVALUATOR_MODEL,
    )
    return result


def run_image_pipeline_batch(
    pipeline: Flux2KleinPipeline,
    **kwargs: object,
) -> list[Image.Image]:
    """Run FLUX.2 Klein and return every image in the generated batch."""
    return list(pipeline(**kwargs).images)


@contextmanager
def aligned_batched_reference_conditioning(
    pipeline: Flux2KleinPipeline,
    scale: float,
) -> Iterator[None]:
    """Condition each batched redraw prompt on its matching source image."""
    original_prepare_image_latents = pipeline.prepare_image_latents

    def prepare_aligned_image_latents(
        images: list[torch.Tensor],
        batch_size: int,
        generator: torch.Generator | list[torch.Generator],
        device: torch.device,
        dtype: torch.dtype,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        if len(images) != batch_size:
            raise ValueError(
                "Batched redraw requires exactly one reference image per prompt."
            )

        encoded_latents: list[torch.Tensor] = []
        for index, image in enumerate(images):
            image_generator = (
                generator[index] if isinstance(generator, list) else generator
            )
            encoded_latents.append(
                pipeline._encode_vae_image(  # noqa: SLF001
                    image=image.to(device=device, dtype=dtype),
                    generator=image_generator,
                )
            )

        packed_latents = torch.cat(
            [pipeline._pack_latents(latent) for latent in encoded_latents],  # noqa: SLF001
            dim=0,
        )
        image_ids = pipeline._prepare_image_ids([encoded_latents[0]])  # noqa: SLF001
        image_ids = image_ids.repeat(batch_size, 1, 1).to(device)
        return packed_latents * scale, image_ids

    pipeline.prepare_image_latents = prepare_aligned_image_latents  # type: ignore[method-assign]
    try:
        yield
    finally:
        pipeline.prepare_image_latents = original_prepare_image_latents  # type: ignore[method-assign]


def seeded_generators(batch_size: int) -> list[torch.Generator]:
    """Preserve per-request determinism while generating a shared GPU batch."""
    return [
        torch.Generator(device="cuda").manual_seed(BASE_SEED)
        for _ in range(batch_size)
    ]


@torch.inference_mode()
def generate_doodle_batch(
    requests: list[tuple[str, DoodleDifficulty | str]],
) -> list[tuple[str, Image.Image, str]]:
    """Generate multiple independent two-stage doodles with shared model passes."""
    if not requests:
        return []

    request_started = time.perf_counter()
    model_prompts = [
        normalize_prompt(prompt, label="사용자 입력 프롬프트")
        for prompt, _ in requests
    ]
    difficulties = [resolve_difficulty(difficulty) for _, difficulty in requests]
    pipeline = get_pipeline()
    batch_size = len(requests)

    with MODEL_LOCK:
        torch.cuda.reset_peak_memory_stats()
        torch.cuda.synchronize()
        stage_one_started = time.perf_counter()
        stage_one_images = run_image_pipeline_batch(
            pipeline,
            prompt=model_prompts,
            width=IMAGE_SIZE,
            height=IMAGE_SIZE,
            num_inference_steps=INFERENCE_STEPS,
            guidance_scale=1.0,
            generator=seeded_generators(batch_size),
        )
        torch.cuda.synchronize()
        stage_one_elapsed = time.perf_counter() - stage_one_started

        redraw_started = time.perf_counter()
        doodles: list[Image.Image | None] = [None] * batch_size
        for difficulty in DoodleDifficulty:
            indices = [
                index
                for index, resolved in enumerate(difficulties)
                if resolved is difficulty
            ]
            if not indices:
                continue

            redraw_prompts = [
                compose_redraw_prompt(model_prompts[index], difficulty)
                for index in indices
            ]
            source_images = [stage_one_images[index] for index in indices]
            with aligned_batched_reference_conditioning(
                pipeline,
                REDRAW_REFERENCE_LATENT_SCALE,
            ):
                redraw_results = run_image_pipeline_batch(
                    pipeline,
                    image=source_images,
                    prompt=redraw_prompts,
                    width=IMAGE_SIZE,
                    height=IMAGE_SIZE,
                    num_inference_steps=REDRAW_INFERENCE_STEPS[difficulty],
                    guidance_scale=1.0,
                    generator=seeded_generators(len(indices)),
                )
            for index, doodle in zip(indices, redraw_results, strict=True):
                doodles[index] = doodle

        torch.cuda.synchronize()
        redraw_elapsed = time.perf_counter() - redraw_started
        peak_vram = gib(torch.cuda.max_memory_reserved())

    total_elapsed = time.perf_counter() - request_started
    LOGGER.info(
        "Generation batch complete · size=%d · total=%.2fs · stage1=%.2fs · "
        "redraw=%.2fs · peak=%.2fGiB",
        batch_size,
        total_elapsed,
        stage_one_elapsed,
        redraw_elapsed,
        peak_vram,
    )
    results: list[tuple[str, Image.Image, str]] = []
    for index, doodle in enumerate(doodles):
        if doodle is None:
            raise RuntimeError("A batched redraw result is missing.")
        difficulty = difficulties[index]
        redraw_steps = REDRAW_INFERENCE_STEPS[difficulty]
        result_status = (
            f"완료 · batch {batch_size} · 총 {total_elapsed:.2f}초 "
            f"(1차 장면 {stage_one_elapsed:.2f}초 + "
            f"2차 낙서 {redraw_elapsed:.2f}초) "
            f"· 난이도 {difficulty.value} ({redraw_steps}스텝) "
            f"· peak VRAM {peak_vram:.2f} GiB"
        )
        results.append((model_prompts[index], doodle, result_status))
    return results


@torch.inference_mode()
def generate_doodle(
    user_prompt: str,
    *,
    difficulty: DoodleDifficulty | str = DEFAULT_DIFFICULTY,
) -> tuple[str, Image.Image, str]:
    """Create a scene from the original prompt, then redraw it by difficulty."""
    return generate_doodle_batch([(user_prompt, difficulty)])[0]


class GenerationJob:
    """One synchronous API request waiting for the GPU batch worker."""

    def __init__(self, prompt: str, difficulty: DoodleDifficulty) -> None:
        self.prompt = prompt
        self.difficulty = difficulty
        self.completed = threading.Event()
        self.result: tuple[str, Image.Image, str] | None = None
        self.error: Exception | None = None


GenerationRunner = Callable[
    [list[tuple[str, DoodleDifficulty | str]]],
    list[tuple[str, Image.Image, str]],
]


class GenerationBatcher:
    """Collect a short burst of API requests into one shared GPU batch."""

    _STOP = object()

    def __init__(
        self,
        *,
        max_batch_size: int,
        wait_seconds: float,
        runner: GenerationRunner = generate_doodle_batch,
    ) -> None:
        self.max_batch_size = max(1, max_batch_size)
        self.wait_seconds = max(0.0, wait_seconds)
        self.runner = runner
        self.jobs: queue.Queue[GenerationJob | object] = queue.Queue(
            maxsize=QUEUE_MAX_SIZE
        )
        self.thread = threading.Thread(
            target=self._worker,
            name="generation-batcher",
            daemon=True,
        )
        self.thread.start()

    def submit(
        self,
        prompt: str,
        difficulty: DoodleDifficulty,
    ) -> tuple[str, Image.Image, str]:
        job = GenerationJob(prompt, difficulty)
        try:
            self.jobs.put_nowait(job)
        except queue.Full as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The generation queue is full. Try again later.",
            ) from exc

        job.completed.wait()
        if job.error is not None:
            raise job.error
        if job.result is None:
            raise RuntimeError("The generation worker returned no result.")
        return job.result

    def close(self) -> None:
        self.jobs.put(self._STOP)
        self.thread.join()

    def _collect_batch(self, first: GenerationJob) -> tuple[list[GenerationJob], bool]:
        batch = [first]
        stop_after_batch = False
        deadline = time.monotonic() + self.wait_seconds
        while len(batch) < self.max_batch_size:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            try:
                item = self.jobs.get(timeout=remaining)
            except queue.Empty:
                break
            if item is self._STOP:
                stop_after_batch = True
                break
            batch.append(item)  # type: ignore[arg-type]
        return batch, stop_after_batch

    def _run_batch(self, batch: list[GenerationJob]) -> None:
        try:
            results = self.runner(
                [(job.prompt, job.difficulty) for job in batch]
            )
            if len(results) != len(batch):
                raise RuntimeError("The generation batch result count is invalid.")
        except torch.OutOfMemoryError as exc:
            torch.cuda.empty_cache()
            if len(batch) == 1:
                batch[0].error = exc
                batch[0].completed.set()
                return
            LOGGER.warning(
                "Generation batch size %d exceeded VRAM; retrying as smaller batches",
                len(batch),
            )
            midpoint = len(batch) // 2
            self._run_batch(batch[:midpoint])
            self._run_batch(batch[midpoint:])
            return
        except Exception as exc:  # noqa: BLE001
            for job in batch:
                job.error = exc
                job.completed.set()
            return

        for job, result in zip(batch, results, strict=True):
            job.result = result
            job.completed.set()

    def _worker(self) -> None:
        while True:
            item = self.jobs.get()
            if item is self._STOP:
                return
            batch, stop_after_batch = self._collect_batch(item)  # type: ignore[arg-type]
            self._run_batch(batch)
            if stop_after_batch:
                return


def load_uploaded_image(upload: UploadFile) -> Image.Image:
    """Validate, orient, and center-crop an uploaded image to 512x512 RGB."""
    data = upload.file.read(MAX_IMAGE_UPLOAD_BYTES + 1)
    if not data:
        raise ValueError("이미지 파일이 비어 있습니다.")
    if len(data) > MAX_IMAGE_UPLOAD_BYTES:
        raise ValueError("이미지 파일은 10MB 이하여야 합니다.")

    try:
        with Image.open(io.BytesIO(data)) as opened:
            width, height = opened.size
            if width * height > MAX_INPUT_IMAGE_PIXELS:
                raise ValueError("이미지 해상도가 너무 큽니다.")
            image = ImageOps.exif_transpose(opened).convert("RGB")
    except (
        Image.DecompressionBombError,
        UnidentifiedImageError,
        OSError,
    ) as exc:
        raise ValueError("지원되는 이미지 파일이 아닙니다.") from exc

    return ImageOps.fit(
        image,
        (IMAGE_SIZE, IMAGE_SIZE),
        method=Image.Resampling.LANCZOS,
    )


@contextmanager
def generation_request() -> Iterator[None]:
    """Reserve one bounded queue slot and map input errors to HTTP 422."""
    if not REQUEST_SLOTS.acquire(blocking=False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The generation queue is full. Try again later.",
        )

    try:
        yield
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    finally:
        REQUEST_SLOTS.release()


def require_internal_api_key(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    """Protect cloud worker APIs when an internal bearer key is configured."""
    if not INTERNAL_API_KEY:
        return

    scheme, _, credential = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not secrets.compare_digest(
        credential,
        INTERNAL_API_KEY,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def png_response(image: Image.Image) -> Response:
    """Encode one image using the common API response contract."""
    output = io.BytesIO()
    image.save(output, format="PNG")
    return Response(
        content=output.getvalue(),
        media_type="image/png",
        headers={
            "Content-Disposition": 'inline; filename="doodle.png"',
            "X-Image-Width": str(IMAGE_SIZE),
            "X-Image-Height": str(IMAGE_SIZE),
        },
    )


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Load one model copy before accepting traffic."""
    global GENERATION_BATCHER
    global OPENAI_CLIENT
    global PIPE

    PIPE = load_pipeline()
    OPENAI_CLIENT = load_openai_client()
    GENERATION_BATCHER = GenerationBatcher(
        max_batch_size=GENERATION_BATCH_MAX_SIZE,
        wait_seconds=(
            GENERATION_BATCH_WAIT_SECONDS
            if GENERATION_BATCH_MAX_SIZE > 1
            else 0.0
        ),
    )
    LOGGER.info(
        "Generation batcher ready (max_batch=%d, wait=%.0fms)",
        GENERATION_BATCH_MAX_SIZE,
        GENERATION_BATCH_WAIT_SECONDS * 1000,
    )
    try:
        yield
    finally:
        GENERATION_BATCHER.close()
        GENERATION_BATCHER = None


app = FastAPI(
    title="FLUX.2 Klein doodle API",
    version="3.0.0",
    lifespan=lifespan,
)


@app.get("/health/live", include_in_schema=False)
def health_live() -> dict[str, str]:
    """Confirm that the HTTP process is alive."""
    return {"status": "ok"}


@app.get("/health/ready", include_in_schema=False)
def health_ready() -> dict[str, str]:
    """Confirm that the GPU model has finished loading and warming up."""
    if PIPE is None or GENERATION_BATCHER is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model pipeline is not ready.",
        )
    return {"status": "ready"}


@app.post(
    "/generate",
    dependencies=[Depends(require_internal_api_key)],
    response_class=Response,
    responses={
        200: {
            "content": {"image/png": {}},
            "description": "The generated 512x512 doodle PNG.",
        },
        503: {"description": "The request queue is full."},
    },
)
def generate(request: GenerateRequest) -> Response:
    """Generate and return the final doodle as a PNG."""
    with generation_request():
        if GENERATION_BATCHER is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The generation worker is not ready.",
            )
        _, doodle, _ = GENERATION_BATCHER.submit(
            normalize_prompt(request.prompt, label="사용자 입력 프롬프트"),
            resolve_difficulty(request.difficulty),
        )
    return png_response(doodle)


@app.post(
    "/evaluate",
    dependencies=[Depends(require_internal_api_key)],
    response_model=EvaluationResponse,
    responses={
        200: {
            "description": "A 0-100 score and a playful one-line Korean comment."
        },
        502: {"description": "The OpenAI evaluation request failed."},
        503: {
            "description": "The queue is full or OpenAI evaluation is not configured."
        },
    },
)
def evaluate(
    image: UploadFile = File(description="The doodle image to evaluate."),
    prompt: str = Form(
        min_length=1,
        max_length=1000,
        description="The target phrase shown to the player.",
    ),
) -> EvaluationResponse:
    """Evaluate how clearly an uploaded doodle represents the target phrase."""
    with generation_request():
        source_image = load_uploaded_image(image)
        try:
            return evaluate_image(source_image, prompt)
        except RuntimeError as exc:
            if str(exc) == "OPENAI_API_KEY is not configured":
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="The evaluation service is not configured.",
                ) from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The evaluation service failed.",
            ) from exc


def run_demo_generation(
    user_prompt: str,
    difficulty: str,
) -> tuple[Image.Image, str, str]:
    """Generate one image from the original prompt for the mounted demo."""
    with generation_request():
        model_prompt, image, result_status = generate_doodle(
            user_prompt,
            difficulty=difficulty,
        )
    return image, model_prompt, result_status


def build_demo() -> gr.Blocks:
    """Build a small prompt-to-doodle test UI."""
    with gr.Blocks(title="FLUX.2 Klein 4B prompt test") as demo:
        gr.Markdown(
            "# FLUX.2 Klein 4B 프롬프트 테스트\n"
            "1차에서 입력한 제시어의 장면을 만들고, 2차에서 그 이미지를 "
            "**난이도별 낙서 스타일**로 다시 그립니다. 제시어의 주인공·핵심 행동·필수 "
            "소품은 세 단계 모두 유지하고, 난이도가 높을수록 선·비율·채색과 세부 표현을 "
            "더 서툴게 만듭니다. 1차와 2차 모두 사용자 원문을 그대로 사용하며 번역이나 "
            "별도 재작성은 하지 않습니다."
        )
        user_prompt = gr.Textbox(
            value="빨간 모자를 쓴 펭귄이 피자를 머리에 올리고 자전거를 탄다",
            label="1차 프롬프트 · 제시어",
            info="여기만 자유롭게 수정하세요.",
            lines=3,
        )
        difficulty = gr.Radio(
            choices=[
                ("쉬움 · 기존 보통 수준", DoodleDifficulty.EASY.value),
                ("보통 · 5초 저선·저채색 낙서", DoodleDifficulty.NORMAL.value),
                ("어려움 · 5초 비주시선 낙서", DoodleDifficulty.HARD.value),
            ],
            value=DEFAULT_DIFFICULTY.value,
            label="낙서 난이도",
            info="정답 요소는 유지하고, 2차 스텝을 3/2/1로 낮추며 어려움에는 의도적인 삐뚤어짐도 더합니다.",
        )
        with gr.Accordion("2차 프롬프트 · 고정 낙서 스타일", open=False):
            style_prompt = gr.Textbox(
                value=get_doodle_style_prompt(DEFAULT_DIFFICULTY),
                label="현재 서버 스타일 지시",
                lines=9,
                interactive=False,
            )
        difficulty.change(
            fn=get_doodle_style_prompt,
            inputs=difficulty,
            outputs=style_prompt,
            queue=False,
            api_visibility="private",
        )

        generate_button = gr.Button("2단계로 낙서 생성", variant="primary")
        generated_image = gr.Image(
            label="생성 결과",
            type="pil",
            format="png",
            height=512,
        )
        model_prompt = gr.Textbox(
            label="1차 장면 생성에 전달된 원문",
            interactive=False,
        )
        result_status = gr.Textbox(label="처리 시간", interactive=False)

        generate_button.click(
            fn=run_demo_generation,
            inputs=[user_prompt, difficulty],
            outputs=[generated_image, model_prompt, result_status],
            api_visibility="private",
            concurrency_limit=1,
            concurrency_id="gpu-generation",
        )

    return demo.queue(api_open=False, default_concurrency_limit=1)


if ENABLE_DEMO:
    DEMO = build_demo()
    app = gr.mount_gradio_app(
        app,
        DEMO,
        path="/demo",
        root_path="/demo",
        footer_links=[],
        run_history=False,
        show_error=True,
        enable_monitoring=False,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=7860)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    import uvicorn

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        workers=1,
        access_log=False,
    )


if __name__ == "__main__":
    main()
