#!/usr/bin/env python3
"""Measure a deployed worker with the production generate contract."""

from __future__ import annotations

import argparse
import json
import statistics
import time
import urllib.request
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("url", help="Worker base URL, without /generate")
    parser.add_argument("--api-key", default="")
    parser.add_argument("--runs", type=int, default=5)
    parser.add_argument("--difficulty", choices=("easy", "normal", "hard"), default="normal")
    parser.add_argument(
        "--prompt",
        default="빨간 모자를 쓴 펭귄이 피자를 머리에 올리고 자전거를 탄다",
    )
    parser.add_argument("--output-dir", default="benchmark-results")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    timings: list[float] = []

    for index in range(args.runs):
        body = json.dumps(
            {"prompt": args.prompt, "difficulty": args.difficulty},
            ensure_ascii=False,
        ).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        if args.api_key:
            headers["Authorization"] = f"Bearer {args.api_key}"
        request = urllib.request.Request(
            f"{args.url.rstrip('/')}/generate",
            data=body,
            headers=headers,
            method="POST",
        )

        started = time.perf_counter()
        with urllib.request.urlopen(request, timeout=180) as response:
            image = response.read()
        elapsed = time.perf_counter() - started
        timings.append(elapsed)
        (output_dir / f"{args.difficulty}-{index + 1:02d}.png").write_bytes(image)
        print(f"run {index + 1}: {elapsed:.3f}s", flush=True)

    result = {
        "url": args.url,
        "difficulty": args.difficulty,
        "runs": args.runs,
        "seconds": timings,
        "mean_seconds": statistics.mean(timings),
        "median_seconds": statistics.median(timings),
        "min_seconds": min(timings),
        "max_seconds": max(timings),
    }
    (output_dir / "result.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
