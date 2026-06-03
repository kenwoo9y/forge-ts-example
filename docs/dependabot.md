# Dependabot

## 概要 (`.github/dependabot.yaml`)

依存パッケージを毎週自動で更新する Pull Request を作成する。各ディレクトリごとに `open-pull-requests-limit` を設定して PR が溜まりすぎないよう制御している。

## 対象ディレクトリ一覧

| ディレクトリ | パッケージエコシステム | PR 上限 |
|---|---|---|
| `/` (ルート) | npm (pnpm ワークスペース) | 5 |
| `/apps/api` | npm | 3 |
| `/apps/api` | docker | 2 |
| `/apps/web` | npm | 3 |
| `/apps/mobile` | npm | 3 |
| `/infra` | npm | 2 |
| `/packages/db` | npm | 2 |
| `/` | github-actions | 2 |
