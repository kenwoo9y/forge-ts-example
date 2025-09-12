# Stage 1: Build
FROM node:24-alpine AS builder
WORKDIR /app

# 依存関係をコピーしてインストール
COPY package.json ./
RUN npm install -g pnpm typescript && npm install

# ソースコードをコピー（node_modulesを除く）
COPY src ./src
COPY tsconfig.json ./

# ビルド
RUN tsc

# Stage 2: Runtime
FROM node:24-alpine AS runner
WORKDIR /app

# 実行に必要なファイルのみコピー
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
