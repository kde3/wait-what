#!/usr/bin/env python3
"""Download only the FLUX.2 Klein component files used by the API."""

from __future__ import annotations

import os
from pathlib import Path

from huggingface_hub import snapshot_download


MODEL_REPO = os.getenv(
    "FLUX2_KLEIN_MODEL_REPO",
    "black-forest-labs/FLUX.2-klein-4B",
)
MODEL_REVISION = os.getenv(
    "FLUX2_KLEIN_MODEL_REVISION",
    "e7b7dc27f91deacad38e78976d1f2b499d76a294",
)
MODEL_DIR = Path(
    os.getenv(
        "FLUX2_KLEIN_MODEL_DIR",
        "/workspace/models/FLUX.2-klein-4B",
    )
)

REQUIRED_FILES = (
    "model_index.json",
    "scheduler/scheduler_config.json",
    "text_encoder/model.safetensors.index.json",
    "transformer/diffusion_pytorch_model.safetensors",
    "vae/diffusion_pytorch_model.safetensors",
)

ALLOW_PATTERNS = (
    "LICENSE.md",
    "model_index.json",
    "scheduler/*",
    "text_encoder/*",
    "tokenizer/*",
    "transformer/*",
    "vae/*",
)


def model_is_complete() -> bool:
    return all((MODEL_DIR / relative_path).is_file() for relative_path in REQUIRED_FILES)


def main() -> None:
    if model_is_complete():
        print(f"Model files already present: {MODEL_DIR}", flush=True)
        return

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(
        f"Downloading {MODEL_REPO}@{MODEL_REVISION} to {MODEL_DIR}...",
        flush=True,
    )
    snapshot_download(
        repo_id=MODEL_REPO,
        revision=MODEL_REVISION,
        local_dir=MODEL_DIR,
        allow_patterns=list(ALLOW_PATTERNS),
        token=os.getenv("HF_TOKEN") or None,
    )

    if not model_is_complete():
        missing = [
            relative_path
            for relative_path in REQUIRED_FILES
            if not (MODEL_DIR / relative_path).is_file()
        ]
        raise RuntimeError(f"Model download is incomplete: {', '.join(missing)}")

    print(f"Model download complete: {MODEL_DIR}", flush=True)


if __name__ == "__main__":
    main()
