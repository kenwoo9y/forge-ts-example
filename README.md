# forge-ts-example

TypeScript モノレポのテンプレート実装例。Hono API・Next.js Web・Expo モバイルの3アプリを Turborepo で管理する。

## ドキュメント

- [技術スタック](docs/tech-stack.md)
- [認証](docs/auth.md)
- [CI/CD](docs/cicd.md)

## 動作要件

| ツール | バージョン |
|---|---|
| Node.js | 22 |
| pnpm | 11.5.2 |

## 起動

```bash
pnpm install
pnpm dev
```

| アプリ | URL |
|---|---|
| API | http://localhost:3000 |
| Web | http://localhost:3001 |
| Mobile | http://localhost:8081 |

## 開発環境 (Codespaces / ローカル)

このリポジトリでは PostgreSQL の接続情報と AWS SSO の設定を環境変数で渡す必要があります。

- Codespaces: リポジトリ（または組織）の Codespaces シークレットとして下記の変数を設定してください。
- ローカル: リポジトリにコミットしないファイル `.devcontainer/.env` を作成し、同じ環境変数を定義してください。テンプレートは `.devcontainer/.env.example` にあります。

```bash
cp .devcontainer/.env.example .devcontainer/.env
# .devcontainer/.env を編集して各値を入力
```

### Codespaces シークレットの設定手順

1. GitHub の該当リポジトリにアクセスします。
2. `Settings` → `Secrets and variables` → `Codespaces` → `Repository secrets` に移動します。
3. 以下の変数をすべて追加します。

**PostgreSQL**

| シークレット名 | 説明 |
|---|---|
| `POSTGRES_DB` | データベース名 |
| `POSTGRES_USER` | ユーザー名 |
| `POSTGRES_PASSWORD` | パスワード |

**AWS SSO**

| シークレット名 | 説明 |
|---|---|
| `SSO_SESSION` | SSO セッション名（任意の名前。例: `my-company`） |
| `SSO_START_URL` | SSO ポータル URL（例: `https://xxxxx.awsapps.com/start`） |
| `SSO_REGION` | SSO リージョン（例: `ap-northeast-1`） |
| `SSO_ACCOUNT_ID` | AWS アカウント ID（例: `123456789012`） |
| `SSO_ROLE_NAME` | 使用する IAM ロール名（例: `AdministratorAccess`） |

シークレットを設定した後、Codespace を作成するか devcontainer を再起動してください。再起動後に `make aws-login` を実行すると `~/.aws/config` が生成され、AWS SSO 認証が完了します。

### Prisma 用環境変数ファイルの作成

Prisma が DB に接続するために `packages/db/.env` が必要です。テンプレートをコピーし、接続情報を設定してください。

```bash
cp packages/db/.env.example packages/db/.env
```

`packages/db/.env` を編集し、接続情報を設定します。

```
DATABASE_URL="postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>"
```

### API 用環境変数ファイルの作成

Hono API の実行に必要な環境変数を `apps/api/.env` に設定します。

```bash
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env` を編集し、各変数に実際の値を設定します。

```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=<POSTGRES_DB>
DB_USERNAME=<POSTGRES_USER>
DB_PASSWORD=<POSTGRES_PASSWORD>
JWT_SECRET="your-secret-key"
```

`JWT_SECRET` は Hono API が JWT の署名・検証に使用するシークレットです。安全なランダム文字列を設定してください。

```bash
# 生成例
openssl rand -base64 32
```

### Web アプリ用環境変数ファイルの作成

`apps/web/.env.local` が必要です。テンプレートをコピーし、各変数を設定してください。

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

```
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
AUTH_SECRET="your-secret-key"
```

- `API_URL` — Auth.js のサインイン処理（サーバーサイド）が Hono API を呼び出すための URL です。
- `AUTH_SECRET` — Auth.js が JWT セッションを暗号化するためのシークレットです。`JWT_SECRET` とは別の値を設定してください。

## テスト

```bash
pnpm test
```

## make コマンド

| コマンド | 内容 |
|---|---|
| `make lint-check` | リントチェック |
| `make lint-fix` | リント自動修正 |
| `make format-check` | フォーマットチェック |
| `make format-fix` | フォーマット自動修正 |
| `make check` | リント + フォーマットチェック |
| `make check-fix` | リント + フォーマット自動修正 |
| `make type-check` | 型チェック |
| `make secrets-scan` | シークレットスキャン |
| `make migrate-generate` | マイグレーションファイル生成 |
| `make migrate` | マイグレーション実行 |
| `make psql` | PostgreSQL に接続 |
| `make aws-login` | AWS SSO ログイン |

## AWS インフラのデプロイ

### 環境構成

DEV から始めて、段階的に STG・PROD を追加できます。

| 環境 | CDK スタック群 | ECR リポジトリ |
|---|---|---|
| DEV（常時） | `DevNetworkStack` / `DevDatabaseStack` / `DevApiStack` / `DevWebStack` | `forge-ts/api-dev`, `forge-ts/web-dev` |
| STG（任意） | `StgNetworkStack` / `StgDatabaseStack` / `StgApiStack` / `StgWebStack` | `forge-ts/api-stg`, `forge-ts/web-stg` |
| PROD（任意） | `ProdNetworkStack` / `ProdDatabaseStack` / `ProdApiStack` / `ProdWebStack` | `forge-ts/api-prod`, `forge-ts/web-prod` |

デプロイフロー（昇格モデル）:

```
main push → DEV 自動デプロイ → (承認) → STG → (承認) → PROD
```

### 初回セットアップ（DEV のみ）

```bash
# 1. CDK bootstrap（初回のみ）
cd infra
npx cdk bootstrap aws://ACCOUNT_ID/REGION

# 2. Secrets Manager に JWT シークレットを作成
aws secretsmanager create-secret --name dev/jwt-secret --secret-string "$(openssl rand -base64 32)"

# 3. ECR・DEV インフラ・パイプラインをデプロイ
#    GitHub との接続を先に作成しておく:
#      AWS コンソール → CodePipeline → Settings → Connections → Create connection
npx cdk deploy --all \
  -c githubOrg=<GitHub ユーザー名または組織名> \
  -c githubRepo=<リポジトリ名> \
  -c codestarConnectionArn=<接続 ARN>

# 4. GitHub Actions のシークレット・変数を設定
#    Settings → Secrets and variables → Actions
#    - Secrets: AWS_APP_DEPLOY_ROLE_ARN（PipelineStack の出力から取得）
#    - Secrets: AWS_INFRA_DIFF_ROLE_ARN（同上）
#    - Variables: AWS_REGION（例: ap-northeast-1）

# 5. main ブランチに push すると GitHub Actions が DEV へ自動デプロイ
```

> **注意**: 初回デプロイに使用した強い権限のロールは、デプロイ完了後に無効化・削除してください。

### STG 環境の追加

```bash
cd infra

# STG 用シークレットを作成
aws secretsmanager create-secret --name stg/jwt-secret --secret-string "$(openssl rand -base64 32)"

# enableStg=true を付けて再デプロイ
npx cdk deploy --all \
  -c enableStg=true \
  -c githubOrg=<GitHub ユーザー名または組織名> \
  -c githubRepo=<リポジトリ名> \
  -c codestarConnectionArn=<接続 ARN>
```

デプロイ後、次回の main push から CodePipeline に STG 承認・昇格ステージが追加されます。

### PROD 環境の追加

```bash
cd infra

# PROD 用シークレットを作成
aws secretsmanager create-secret --name prod/jwt-secret --secret-string "$(openssl rand -base64 32)"

# enableStg=true enableProd=true を付けて再デプロイ
npx cdk deploy --all \
  -c enableStg=true \
  -c enableProd=true \
  -c githubOrg=<GitHub ユーザー名または組織名> \
  -c githubRepo=<リポジトリ名> \
  -c codestarConnectionArn=<接続 ARN>
```

### リソースサイズのデフォルト値

全環境で最小コスト設定が共通のデフォルトです。環境変数で環境ごとに上書きできます。

| 項目 | デフォルト | 上書き用環境変数の例 |
|---|---|---|
| API CPU | 256 | `PROD_API_CPU=1024` |
| API メモリ (MiB) | 512 | `PROD_API_MEMORY_MIB=2048` |
| API タスク数 | 1 | `PROD_API_DESIRED_COUNT=2` |
| Web CPU | 256 | `PROD_WEB_CPU=1024` |
| Web メモリ (MiB) | 512 | `PROD_WEB_MEMORY_MIB=2048` |
| Web タスク数 | 1 | `PROD_WEB_DESIRED_COUNT=2` |
| DB インスタンス | t3.micro | `PROD_DB_INSTANCE_TYPE=t3.medium` |
| DB ストレージ (GB) | 20 | `PROD_DB_ALLOCATED_STORAGE=50` |

## データベース

### マイグレーション

マイグレーションファイルの生成と実行には `make` コマンドを使用します。

```bash
# マイグレーションファイルを生成（スキーマ変更後に実行）
make migrate-generate

# マイグレーションを実行
make migrate
```

- `make migrate-generate` は `packages/db/prisma/schema.prisma` の変更を元に新しいマイグレーションファイルを `packages/db/prisma/migrations/` に生成します（`--create-only` のため、適用は行いません）。
- `make migrate` はマイグレーションを実行し、ローカルの PostgreSQL データベースに反映します。

### DB 接続

ローカルの PostgreSQL データベースに直接接続するには、以下のコマンドを実行します。

```bash
make psql
```

パスワードの入力を求められるので、`.devcontainer/.env` に設定した `POSTGRES_PASSWORD` の値を入力してください。
