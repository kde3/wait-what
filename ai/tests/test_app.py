from __future__ import annotations

import concurrent.futures
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import app
from fastapi import HTTPException
from PIL import Image


class FakeResponses:
    def __init__(self) -> None:
        self.create_kwargs: dict[str, object] | None = None
        self.parse_kwargs: dict[str, object] | None = None

    def create(self, **kwargs: object) -> SimpleNamespace:
        self.create_kwargs = kwargs
        return SimpleNamespace(output_text="고양이가 우산을 들고 서 있다.")

    def parse(self, **kwargs: object) -> SimpleNamespace:
        self.parse_kwargs = kwargs
        return SimpleNamespace(
            output_parsed=app.EvaluationResponse(
                score=91,
                comment="고양이와  우산이\n바로 보이네요.",
            )
        )


class OpenAIEvaluationTests(unittest.TestCase):
    def test_uses_grounded_two_pass_evaluation(self) -> None:
        responses = FakeResponses()
        client = SimpleNamespace(responses=responses)
        image = Image.new("RGB", (512, 512), "white")

        with patch.object(app, "OPENAI_CLIENT", client):
            result = app.evaluate_image(image, "우산을 든 고양이")

        self.assertEqual(result.score, 91)
        self.assertEqual(result.comment, "고양이와 우산이 바로 보이네요.")
        self.assertIsNotNone(responses.create_kwargs)
        self.assertIsNotNone(responses.parse_kwargs)
        self.assertEqual(
            responses.create_kwargs["model"],
            "gpt-5.6-luna",
        )
        self.assertEqual(
            responses.parse_kwargs["model"],
            "gpt-5.6-luna",
        )
        self.assertNotIn("우산을 든 고양이", responses.create_kwargs["instructions"])
        self.assertIn("우산을 든 고양이", responses.parse_kwargs["instructions"])
        self.assertIs(
            responses.parse_kwargs["text_format"],
            app.EvaluationResponse,
        )

        content = responses.create_kwargs["input"][0]["content"]
        self.assertTrue(content[0]["image_url"].startswith("data:image/png;base64,"))

    def test_requires_api_key_configuration(self) -> None:
        with patch.object(app, "OPENAI_CLIENT", None):
            with self.assertRaisesRegex(RuntimeError, "OPENAI_API_KEY"):
                app.evaluate_image(
                    Image.new("RGB", (512, 512), "white"),
                    "고양이",
                )


class ApiContractTests(unittest.TestCase):
    def test_exposes_only_generate_and_evaluate_post_apis(self) -> None:
        schema = app.app.openapi()
        self.assertIn("post", schema["paths"]["/generate"])
        self.assertIn("post", schema["paths"]["/evaluate"])
        self.assertNotIn("/edit", schema["paths"])

    def test_evaluation_response_forbids_extra_properties(self) -> None:
        schema = app.EvaluationResponse.model_json_schema()
        self.assertFalse(schema["additionalProperties"])
        self.assertEqual(schema["properties"]["score"]["minimum"], 0)
        self.assertEqual(schema["properties"]["score"]["maximum"], 100)

    def test_redraw_prompts_vary_drawing_skill_without_dropping_target(self) -> None:
        original_prompt = "빨간 모자를 쓴 펭귄이 자전거를 탄다"
        prompts = {
            difficulty: app.compose_redraw_prompt(original_prompt, difficulty)
            for difficulty in app.DoodleDifficulty
        }

        self.assertEqual(len(prompts), 3)
        for difficulty, prompt in prompts.items():
            self.assertIn(original_prompt, prompt)
            self.assertIn(app.DIFFICULTY_STYLE_PROMPTS[difficulty], prompt)
        self.assertIn("BADLY DRAWN AMATEUR", prompts[app.DoodleDifficulty.EASY])
        self.assertIn("FIVE-SECOND LOW-LINE", prompts[app.DoodleDifficulty.NORMAL])
        self.assertIn("FIVE-SECOND BLIND-CONTOUR", prompts[app.DoodleDifficulty.HARD])
        self.assertIn("CLEARLY GUESSABLE", prompts[app.DoodleDifficulty.NORMAL])
        self.assertIn("STILL GUESSABLE", prompts[app.DoodleDifficulty.HARD])
        self.assertIn("every requested", prompts[app.DoodleDifficulty.EASY])
        self.assertIn("never by deleting", prompts[app.DoodleDifficulty.HARD])
        self.assertIn("LINE BUDGET", prompts[app.DoodleDifficulty.HARD])
        self.assertIn("COLOR BUDGET", prompts[app.DoodleDifficulty.HARD])
        self.assertIn("DELIBERATELY MAKE IT CROOKED", prompts[app.DoodleDifficulty.HARD])
        self.assertIn("never trace over", prompts[app.DoodleDifficulty.HARD])
        self.assertNotIn("wandering lines", prompts[app.DoodleDifficulty.HARD])
        self.assertNotIn("overshooting lines", prompts[app.DoodleDifficulty.HARD])
        self.assertLess(
            prompts[app.DoodleDifficulty.NORMAL].index("CONTENT:"),
            prompts[app.DoodleDifficulty.NORMAL].index("STYLE PRIORITY:"),
        )
        self.assertLess(
            prompts[app.DoodleDifficulty.HARD].index("CONTENT:"),
            prompts[app.DoodleDifficulty.HARD].index("STYLE PRIORITY:"),
        )

    def test_generate_schema_defaults_to_normal_difficulty(self) -> None:
        request = app.GenerateRequest(prompt="고양이")

        self.assertEqual(request.difficulty, app.DoodleDifficulty.NORMAL)

    def test_generate_schema_accepts_each_difficulty(self) -> None:
        for difficulty in app.DoodleDifficulty:
            request = app.GenerateRequest(prompt="고양이", difficulty=difficulty.value)
            self.assertEqual(request.difficulty, difficulty)

    def test_defaults_to_gpt_5_6_luna(self) -> None:
        self.assertEqual(app.OPENAI_EVALUATOR_MODEL, "gpt-5.6-luna")

    def test_redraw_steps_decrease_with_difficulty(self) -> None:
        self.assertEqual(
            app.REDRAW_INFERENCE_STEPS,
            {
                app.DoodleDifficulty.EASY: 3,
                app.DoodleDifficulty.NORMAL: 2,
                app.DoodleDifficulty.HARD: 1,
            },
        )

    def test_internal_api_key_is_optional_and_uses_bearer_auth(self) -> None:
        with patch.object(app, "INTERNAL_API_KEY", ""):
            app.require_internal_api_key(None)

        with patch.object(app, "INTERNAL_API_KEY", "worker-secret"):
            app.require_internal_api_key("Bearer worker-secret")
            with self.assertRaises(HTTPException) as raised:
                app.require_internal_api_key("Bearer wrong-secret")

        self.assertEqual(raised.exception.status_code, 401)


class GenerationBatcherTests(unittest.TestCase):
    def test_batched_redraw_keeps_one_reference_per_prompt(self) -> None:
        class FakePipeline:
            def prepare_image_latents(self, *_: object, **__: object) -> None:
                return None

            def _encode_vae_image(
                self,
                image: app.torch.Tensor,
                generator: object,
            ) -> app.torch.Tensor:
                del generator
                return image

            def _pack_latents(
                self,
                latents: app.torch.Tensor,
            ) -> app.torch.Tensor:
                return latents.flatten(2).transpose(1, 2)

            def _prepare_image_ids(
                self,
                latents: list[app.torch.Tensor],
            ) -> app.torch.Tensor:
                sequence_length = latents[0].shape[-2] * latents[0].shape[-1]
                return app.torch.zeros((1, sequence_length, 4))

        pipeline = FakePipeline()
        references = [
            app.torch.full((1, 2, 2, 2), 1.0),
            app.torch.full((1, 2, 2, 2), 2.0),
        ]
        with app.aligned_batched_reference_conditioning(pipeline, 0.5):
            latents, image_ids = pipeline.prepare_image_latents(
                references,
                batch_size=2,
                generator=[object(), object()],
                device=app.torch.device("cpu"),
                dtype=app.torch.float32,
            )

        self.assertEqual(tuple(latents.shape), (2, 4, 2))
        self.assertTrue(app.torch.all(latents[0] == 0.5))
        self.assertTrue(app.torch.all(latents[1] == 1.0))
        self.assertEqual(tuple(image_ids.shape), (2, 4, 4))

    def test_collects_four_simultaneous_requests_into_one_batch(self) -> None:
        observed_batch_sizes: list[int] = []
        barrier = threading.Barrier(5)

        def runner(
            requests: list[tuple[str, app.DoodleDifficulty | str]],
        ) -> list[tuple[str, Image.Image, str]]:
            observed_batch_sizes.append(len(requests))
            return [
                (prompt, Image.new("RGB", (8, 8), "white"), "ok")
                for prompt, _ in requests
            ]

        batcher = app.GenerationBatcher(
            max_batch_size=4,
            wait_seconds=0.1,
            runner=runner,
        )

        def submit(index: int) -> tuple[str, Image.Image, str]:
            barrier.wait()
            return batcher.submit(
                f"prompt-{index}",
                app.DoodleDifficulty.NORMAL,
            )

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(submit, index) for index in range(4)]
                barrier.wait()
                results = [future.result(timeout=2) for future in futures]
        finally:
            batcher.close()

        self.assertEqual(observed_batch_sizes, [4])
        self.assertEqual(
            {result[0] for result in results},
            {"prompt-0", "prompt-1", "prompt-2", "prompt-3"},
        )

    def test_retries_an_oom_batch_as_two_smaller_batches(self) -> None:
        observed_batch_sizes: list[int] = []

        def runner(
            requests: list[tuple[str, app.DoodleDifficulty | str]],
        ) -> list[tuple[str, Image.Image, str]]:
            observed_batch_sizes.append(len(requests))
            if len(requests) == 4:
                raise app.torch.OutOfMemoryError("test OOM")
            return [
                (prompt, Image.new("RGB", (8, 8), "white"), "ok")
                for prompt, _ in requests
            ]

        jobs = [
            app.GenerationJob(f"prompt-{index}", app.DoodleDifficulty.NORMAL)
            for index in range(4)
        ]
        batcher = app.GenerationBatcher(
            max_batch_size=4,
            wait_seconds=0,
            runner=runner,
        )
        try:
            batcher._run_batch(jobs)
        finally:
            batcher.close()

        self.assertEqual(observed_batch_sizes, [4, 2, 2])
        self.assertTrue(all(job.result is not None for job in jobs))

if __name__ == "__main__":
    unittest.main()
