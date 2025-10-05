FROM mcr.microsoft.com/devcontainers/typescript-node:22

# システムパッケージの更新
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    sudo \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# nodeユーザーにsudo権限を付与
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# nodeユーザーのホームディレクトリを作成
RUN mkdir -p /home/node && \
    chown -R node:node /home/node

# pnpmのインストール
RUN npm install -g pnpm@10.14.0

# pnpmのパスを確認して設定
RUN which pnpm && pnpm --version

# PATHの設定
ENV PATH="/home/node/.pnpm:$PATH"

# 開発ツールのインストール
RUN npm install -g \
    @biomejs/biome \
    turbo

# 作業ディレクトリの設定
WORKDIR /workspace

# pnpmの設定とディレクトリ作成
RUN mkdir -p /home/node/.pnpm-store && \
    chown -R node:node /home/node/.pnpm-store

# 環境変数の設定
ENV PNPM_HOME=/home/node/.pnpm
ENV PNPM_STORE_PATH=/home/node/.pnpm-store
ENV NODE_ENV=development

# ユーザーに切り替え
USER node

# pnpmの設定（nodeユーザーで実行）
RUN pnpm config set store-dir /home/node/.pnpm-store && \
    pnpm config set cache-dir /home/node/.pnpm-store && \
    pnpm config set state-dir /home/node/.pnpm-store

# シェルの設定
SHELL ["/bin/bash", "-c"]
