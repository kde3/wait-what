# 깃허브 협업 방법

브랜치 하나에 기능 하나. 아래를 반복한다.

## 1. main 최신으로 맞추고 브랜치 생성

```bash
git checkout main
git pull
git checkout -b feat/기능이름
```

## 2. 기능 개발 → 커밋

```bash
git add .
git commit -m "feat: 기능 설명"
```

## 3. 푸시 직전에 main 최신 반영

충돌이 나면 여기서 해결한다.

```bash
git fetch origin
git merge origin/main
```

## 4. 푸시 → PR 생성 → Squash and merge

```bash
git push -u origin feat/기능이름
```

## 5. PR 머지 확인 후 로컬 정리

```bash
git checkout main
git pull
git branch -D feat/기능이름
```

Squash and merge는 커밋을 하나로 합쳐 넣기 때문에 원래 커밋이 main에 그대로 남지 않는다. 그래서 `git branch -d`는 "아직 머지 안 됨"이라며 거부하고, `-D`로 지워야 한다.
