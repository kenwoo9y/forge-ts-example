FROM mcr.microsoft.com/devcontainers/typescript-node:18

# システムパッケージの更新
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# pnpmのインストール
RUN npm install -g pnpm@8.15.4

# 開発ツールのインストール
RUN npm install -g \
    @biomejs/biome \
    turbo \
    typescript

# 作業ディレクトリの設定
WORKDIR /workspace

# ユーザー権限の設定
RUN chown -R node:node /workspace
USER node

# シェルの設定
SHELL ["/bin/bash", "-c"]
