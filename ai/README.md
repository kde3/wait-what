# FLUX doodle API

FLUX.2 Klein 4B로 512×512 파티게임 낙서를 생성하고 OpenAI 비전 모델로 정답 전달력을 평가하는 FastAPI 서버다.

## API

- `POST /generate`: JSON `{ "prompt": "...", "difficulty": "easy|normal|hard" }` → PNG
- `POST /evaluate`: multipart `image`, `prompt` → JSON `{ "score": 0, "comment": "..." }`
- `GET /health/live`: HTTP 프로세스 확인
- `GET /health/ready`: GPU 모델 로딩 완료 확인

`INTERNAL_API_KEY`를 설정하면 두 POST API는 `Authorization: Bearer <key>` 헤더를 요구한다. 헬스체크는 인증 없이 접근할 수 있다.

## 환경 변수

| 이름 | 기본값 | 설명 |
|---|---|---|
| `FLUX2_KLEIN_MODEL_DIR` | `models/FLUX.2-klein-4B` | 로컬 모델 경로 |
| `INTERNAL_API_KEY` | 비어 있음 | Worker 호출용 Bearer 키 |
| `OPENAI_API_KEY` | 비어 있음 | `/evaluate` 사용 시 필요 |
| `OPENAI_EVALUATOR_MODEL` | `gpt-5.6-luna` | 평가 모델 |
| `ENABLE_DEMO` | `1` | `/demo` Gradio UI 활성화 |
| `GENERATION_BATCH_MAX_SIZE` | `1` | 짧은 요청 버스트를 묶을 최대 GPU 배치 크기(1~4) |
| `GENERATION_BATCH_WAIT_MS` | `35` | 첫 요청 후 추가 요청을 모으는 최대 시간(ms) |

## 로컬 실행

```bash
uv venv --python 3.11
uv pip install --python .venv/bin/python -r requirements-dev.txt
.venv/bin/python app.py --host 127.0.0.1 --port 7860
```

## Docker

컨테이너는 모델을 이미지에 포함하지 않는다. 시작할 때 Hugging Face에서 필요한 구성요소 약 15GB만 `/workspace/models`에 내려받고, 이후에는 Pod의 영구 볼륨을 재사용한다.

```bash
docker build -t flux-doodle-api .
docker run --gpus all --rm \
  -p 7860:7860 \
  -v flux-models:/workspace \
  -e INTERNAL_API_KEY=replace-me \
  -e HF_TOKEN=replace-if-needed \
  flux-doodle-api
```

클라우드 Worker에서는 `ENABLE_DEMO=0`이 기본값이며, OpenAI 키를 넣지 않아도 `/generate`는 동작한다.

## RunPod Pod 배포

1. `ai/deploy/github-actions-container.yml.example`을 저장소 루트의 `.github/workflows/container.yml`로 옮기면 GitHub Actions가 `ghcr.io/<owner>/<repo>-ai:latest` 이미지를 생성한다. 이 파일을 푸시하려면 GitHub CLI 토큰의 `workflow` scope가 필요하다.
2. 저장소와 컨테이너 패키지를 비공개로 유지하면 RunPod에 GHCR registry credential을 등록한다.
3. Community RTX 4090, 컨테이너 디스크 20GB, 영구 볼륨 40GB, HTTP 포트 `7860`으로 Pod를 만든다. 컨테이너 기본값은 최대 4건, 35ms 마이크로 배치다.
4. `https://<pod-id>-7860.proxy.runpod.net/health/ready`가 200이 될 때까지 기다린다.
5. `scripts/benchmark_api.py`로 실제 생성속도와 안정성을 측정한다.

RunPod Pod의 생성·중지·로그 확인에는 `runpodctl`을 사용한다. GPU 비용이 계속 발생하므로 벤치마크가 끝난 Pod는 즉시 중지한다.

## 테스트

```bash
.venv/bin/python -m unittest discover -s tests -v
```
