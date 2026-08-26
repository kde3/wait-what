from __future__ import annotations

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

if __name__ == "__main__":
    unittest.main()
