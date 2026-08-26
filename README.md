# 아니, 이게뭐야? (Wait, what?)

## 개발
```
npm --prefix frontend install
npm --prefix backend install
npm run dev:backend
npm run dev:frontend
npm run storybook
```

## AI 서버

FLUX.2 Klein 생성 서버와 RunPod 배포 파일은 `ai/`에 있다.

```bash
docker build -t wait-what-ai ./ai
npm --prefix backend run test:e2e
```

게임 백엔드는 `AI_SERVER_URL`과 Cloudflare Access용 `AI_SERVER_KEY`/`AI_SERVER_SECRET`을 사용한다. RunPod Pod를 직접 호출할 때는 `AI_SERVER_TOKEN`을 대신 설정할 수 있다.
