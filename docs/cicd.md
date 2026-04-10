# CI/CD

## E2E テスト (`.github/workflows/e2e.yaml`)

### 概要

`main` ブランチへの Pull Request で `apps/web/**` または `apps/api/**` に変更があった場合に Playwright E2E テストを実行するワークフロー。

### 必要な GitHub Secrets

リポジトリの **Settings > Secrets and variables > Actions** に以下を登録する。

| Secret 名 | 必須 | 説明 |
|---|---|---|
| `E2E_USERNAME` | 必須 | E2E テスト用ユーザーのユーザー名 |
| `E2E_PASSWORD` | 必須 | E2E テスト用ユーザーのパスワード |
| `JWT_SECRET` | 任意 | JWT 署名シークレット |
| `AUTH_SECRET` | 任意 | Auth.js のシークレット |

### ワークフローの実行ステップ

1. **コードのチェックアウト** (`actions/checkout@v4`)
2. **Node.js セットアップ** (`actions/setup-node@v4`, LTS バージョン)
3. **依存パッケージのインストール** (`pnpm install`)
4. **内部パッケージのビルド** (`packages/auth`, `packages/error`, `packages/schema`)
5. **Prisma クライアント生成** (`prisma generate`)
6. **DB マイグレーション実行** (`prisma migrate deploy`)
   - PostgreSQL サービスコンテナ（`postgres:16`）をバックグラウンドで起動
   - 接続先: `postgresql://postgres:postgres@localhost:5432/test_db`
7. **API サーバー起動** (`apps/api/src/index.ts` をバックグラウンド実行)
8. **API の起動待機** (`http://localhost:3000` に最大 30 回ポーリング)
9. **E2E テストユーザー作成** (`POST /users` で `E2E_USERNAME` / `E2E_PASSWORD` のユーザーを登録)
10. **Playwright ブラウザのインストール** (`playwright install --with-deps`)
11. **Playwright テスト実行** (`apps/web` 配下)
    - `BASE_URL`: `http://localhost:3001`
    - `NEXT_PUBLIC_API_URL` / `API_URL`: `http://localhost:3000`
12. **テストレポートのアップロード** (`apps/web/playwright-report/` を 30 日間保持)

### E2E テスト用環境変数（テスト実行時）

| 環境変数 | 値 |
|---|---|
| `CI` | `true` |
| `E2E_USERNAME` | Secrets から注入 |
| `E2E_PASSWORD` | Secrets から注入 |
| `BASE_URL` | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` |
| `API_URL` | `http://localhost:3000` |
| `AUTH_SECRET` | Secrets から注入（未設定時は `ci-auth-secret`） |

### ローカルでの事前確認

以下を確認してから PR を作成すると、CI 失敗を防ぎやすい。

```bash
# 内部パッケージのビルド
pnpm --filter auth --filter error --filter schema build

# Prisma クライアント生成
pnpm --filter db exec prisma generate

# マイグレーション適用（ローカル DB が起動している前提）
pnpm --filter db exec prisma migrate deploy

# API サーバー起動
cd apps/api && pnpm exec tsx src/index.ts

# Playwright テスト実行
cd apps/web && pnpm exec playwright test
```
