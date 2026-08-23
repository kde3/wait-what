FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["./node_modules/.bin/tsx", "server.ts"]
