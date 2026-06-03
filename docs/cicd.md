# CI/CD

## CI - API (`.github/workflows/ci-api.yaml`)

### 概要

`main` ブランチへの Pull Request で `apps/api/**`・`packages/**`・`pnpm-lock.yaml` に変更があった場合に実行されるワークフロー。Lint/Format チェック・型チェック・ユニットテストの 3 ジョブが並列で動く。

### ジョブ一覧

| ジョブ | 内容 |
|---|---|
| `lint-and-format` | `biome check apps/api` でコードスタイルを検証 |
| `type-check` | `error` / `schema` パッケージのビルドと Prisma クライアント生成後に `pnpm --filter api run type-check` を実行 |
| `unit-test` | 同上の前準備後に `pnpm --filter api run test:coverage` でカバレッジ付きテストを実行 |

---

## CI - Web (`.github/workflows/ci-web.yaml`)

### 概要

`main` ブランチへの Pull Request で `apps/web/**`・`packages/**`・`pnpm-lock.yaml` に変更があった場合に実行されるワークフロー。Lint/Format チェック・型チェック・ユニットテストの 3 ジョブが並列で動く。

### ジョブ一覧

| ジョブ | 内容 |
|---|---|
| `lint-and-format` | `pnpm --filter web run lint` で Next.js の ESLint ルールを検証 |
| `type-check` | `error` / `schema` / `auth` パッケージのビルド後に `pnpm --filter web run type-check` を実行 |
| `unit-test` | 同上の前準備後に `pnpm --filter web run test:coverage` でカバレッジ付きテストを実行 |

---

## CI - Mobile (`.github/workflows/ci-mobile.yaml`)

### 概要

`main` ブランチへの Pull Request で `apps/mobile/**` に変更があった場合に実行されるワークフロー。Lint/Format チェック・型チェック・ユニットテストの 3 ジョブが並列で動く。

### ジョブ一覧

| ジョブ | 内容 |
|---|---|
| `lint-and-format` | `pnpm --filter mobile run lint` で Lint チェックを実行 |
| `type-check` | `pnpm --filter mobile run type-check` で型検証 |
| `unit-test` | `pnpm --filter mobile run test:coverage` でカバレッジ付きテストを実行 |

---

## CI - Infra (`.github/workflows/ci-infra.yaml`)

### 概要

`main` ブランチへの Pull Request で `infra/**` に変更があった場合に実行されるワークフロー。AWS CDK コードを対象に Lint/Format チェック・型チェック・ユニットテストの 3 ジョブが並列で動く。

### ジョブ一覧

| ジョブ | 内容 |
|---|---|
| `lint-and-format` | `biome check infra` でコードスタイルを検証 |
| `type-check` | `pnpm --filter infra run type-check` で型検証 |
| `unit-test` | `pnpm --filter infra run test:coverage` でカバレッジ付きテストを実行 |

---

## E2E テスト (`.github/workflows/e2e.yaml`)

### 概要

`main` ブランチへの Pull Request で `apps/web/**` または `apps/api/**` に変更があった場合に Playwright E2E テストを実行するワークフロー（ワークフロー名: `Playwright Tests`）。タイムアウトは 60 分。GitHub Environment（`github.base_ref`）を参照して環境別の設定を適用する。

### 必要な GitHub Secrets

リポジトリの **Settings > Secrets and variables > Actions** に以下を登録する。

| Secret 名 | 必須 | 説明 |
|---|---|---|
| `E2E_USERNAME` | 必須 | E2E テスト用ユーザーのユーザー名 |
| `E2E_PASSWORD` | 必須 | E2E テスト用ユーザーのパスワード |
| `JWT_SECRET` | 任意 | JWT 署名シークレット（未設定時は `ci-jwt-secret`） |
| `AUTH_SECRET` | 任意 | Auth.js のシークレット（未設定時は `ci-auth-secret`） |

### ワークフローの実行ステップ

1. **コードのチェックアウト** (`actions/checkout@v6`)
2. **Node.js セットアップ** (`actions/setup-node@v6`, LTS バージョン)
3. **依存パッケージのインストール** (`npm install -g pnpm && pnpm install`)
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
12. **テストレポートのアップロード** (`apps/web/playwright-report/` を 30 日間保持、キャンセル時も実行)

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
| `AUTH_TRUST_HOST` | `true` |

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

---

## CD - アプリデプロイ (`.github/workflows/app-deploy.yaml`)

### 概要

`CI - API`・`CI - Web`・`Playwright Tests` の 3 ワークフローがすべて成功した後に起動するワークフロー。全 CI 通過を確認してから Docker イメージをビルドして DEV 環境の ECR へ push する。push が CodePipeline のトリガーとなり、DEV→STG→PROD の昇格パイプラインが起動する。

同一コミットに対する重複実行は `concurrency` グループ（`app-deploy-<head_sha>`）でキャンセルされる。

### 処理フロー

```
check-all-ci ─┬─ build-push-scan (api)
              └─ build-push-scan (web)
```

### ジョブ一覧

| ジョブ | 内容 |
|---|---|
| `check-all-ci` | `CI - API`・`CI - Web`・`Playwright Tests` の全ワークフローが同一 SHA で成功済みか検証 |
| `build-push-scan` | OIDC 認証 → Docker ビルド → ECR push → スキャン結果確認（api / web の matrix） |

### ECR push とスキャンゲート

- `:${GITHUB_SHA}` と `:latest` の 2 タグを push する
- `imageScanOnPush: true` のためプッシュ直後にスキャンが実行される
- `CRITICAL` 脆弱性が 1 件でも検出された場合はワークフローが失敗し、パイプラインは起動しない

### 必要な GitHub Secrets / Variables

| 名前 | 種別 | 説明 |
|---|---|---|
| `AWS_APP_DEPLOY_ROLE_ARN` | Secret | OIDC ロール ARN（ECR push 専用、ECS/CodePipeline 操作不可） |
| `AWS_REGION` | Variable | AWS リージョン（例: `ap-northeast-1`） |

---

## CD - インフラ diff (`.github/workflows/infra-diff.yaml`)

### 概要

`CI - Infra` ワークフローが成功した後に起動し、`cdk diff` を実行して差分を PR コメントとして自動投稿するワークフロー。再実行時は既存コメントを更新する。

### 処理フロー

1. AWS OIDC 認証（読み取り専用ロール）
2. `npx cdk synth --no-notices`
3. `npx cdk diff --no-notices --no-color`
4. 差分を PR コメントに投稿（再実行時は既存コメントを更新）

### 必要な GitHub Secrets / Variables

| 名前 | 種別 | 説明 |
|---|---|---|
| `AWS_INFRA_DIFF_ROLE_ARN` | Secret | OIDC ロール ARN（CloudFormation 読み取り専用、デプロイ不可） |
| `AWS_REGION` | Variable | AWS リージョン |

---

## CD - インフラパイプライン（CodePipeline: `InfraCdkPipeline`）

### 概要

`main` への push を CodeStar Connections 経由で検知し、CDK スタックを自動デプロイするパイプライン。**本番適用前に手動承認ゲートを挟む**。

### ステージ構成

| ステージ | 内容 |
|---|---|
| Source | GitHub から最新コードを取得（CodeStar Connections） |
| Synth | CodeBuild で `npx cdk synth` を実行 |
| Approve | 手動承認（差分を確認してから本番適用） |
| Deploy | CodeBuild で `npx cdk deploy --require-approval never --all` を実行 |

---

## CD - アプリパイプライン（CodePipeline: `ApiAppPipeline` / `WebAppPipeline`）

### 概要

ECR の `:latest` タグ更新を EventBridge で検知して起動するパイプライン。DEV への自動デプロイ後、承認を経て STG・PROD へ順番にイメージを昇格させる。

### 昇格モデル

```
ECR forge-ts/api-dev:latest push
  └─ DEV 自動デプロイ（Blue/Green, LINEAR_10PERCENT_EVERY_1MINUTES）
       └─ 承認（enableStg 時）
            └─ forge-ts/api-stg:latest へ昇格（同一イメージダイジェスト）
                 └─ STG 自動デプロイ
                      └─ 承認（enableProd 時）
                           └─ forge-ts/api-prod:latest へ昇格
                                └─ PROD 自動デプロイ
```

昇格はイメージの**再ビルドなし**でマニフェストをコピーするため、DEV で検証済のバイナリがそのまま PROD に届く。

### ステージ構成

| ステージ | 常時 | enableStg | enableProd |
|---|---|---|---|
| Source | ✓ | ✓ | ✓ |
| GenerateDev | ✓ | ✓ | ✓ |
| DeployDev | ✓ | ✓ | ✓ |
| ApproveStg | | ✓ | ✓ |
| PromoteToStg | | ✓ | ✓ |
| GenerateStg | | ✓ | ✓ |
| DeployStg | | ✓ | ✓ |
| ApproveProd | | | ✓ |
| PromoteToProd | | | ✓ |
| GenerateProd | | | ✓ |
| DeployProd | | | ✓ |

### デプロイ設定

| 設定 | 値 |
|---|---|
| デプロイ戦略 | `LINEAR_10PERCENT_EVERY_1MINUTES`（段階的トラフィック移行） |
| 失敗時 | 自動ロールバック |
| 旧タスク削除 | デプロイ成功直後に自動削除 |
| ALB リスナー | 本番用 :80 / テスト用 :8080 |

