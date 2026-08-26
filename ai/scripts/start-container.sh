#!/usr/bin/env bash
set -Eeuo pipefail

python /app/scripts/verify_cuda.py
python /app/scripts/download_model.py

exec python /app/app.py \
  --host "${HOST:-0.0.0.0}" \
  --port "${PORT:-7860}"
