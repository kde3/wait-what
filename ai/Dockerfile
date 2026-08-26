FROM runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404

ENV PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    ENABLE_DEMO=0 \
    GENERATION_BATCH_MAX_SIZE=4 \
    GENERATION_BATCH_WAIT_MS=35 \
    TORCHAO_FORCE_SKIP_LOADING_SO_FILES=1 \
    TORCHINDUCTOR_CACHE_DIR=/workspace/.cache/torchinductor \
    PORT=7860 \
    FLUX2_KLEIN_MODEL_DIR=/workspace/models/FLUX.2-klein-4B \
    HF_HOME=/workspace/.cache/huggingface

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m pip install --break-system-packages --no-cache-dir -r requirements.txt

COPY app.py ./
COPY scripts/download_model.py scripts/start-container.sh scripts/verify_cuda.py ./scripts/
RUN chmod 0755 ./scripts/start-container.sh

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=10m --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:7860/health/ready', timeout=3)"

ENTRYPOINT ["/opt/nvidia/nvidia_entrypoint.sh"]
CMD ["/app/scripts/start-container.sh"]
