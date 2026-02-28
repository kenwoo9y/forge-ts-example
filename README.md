# forge-ts-example

## 起動

```bash
pnpm install
pnpm dev
```

| アプリ | URL |
|---|---|
| API | http://localhost:3000 |
| Web | http://localhost:3001 |

## 開発環境 (Codespaces / ローカル)

このリポジトリでは PostgreSQL の接続情報を環境変数で渡す必要があります。

- Codespaces: リポジトリ（または組織）の Codespaces シークレットとして `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` を設定してください。devcontainer はこれらのシークレットを優先して使います。
- ローカル: リポジトリにコミットしないファイル `.devcontainer/.env` を作成し、同じ環境変数を定義してください。テンプレートは `.devcontainer/.env.example` にあります。

devcontainer は起動時に必要な環境変数が揃っていることをチェックします。変数が不足している場合はセットアップを中止し、Codespaces のシークレットを設定するか、ローカルで `.devcontainer/.env` を作成するよう指示されます。

### Codespaces シークレットの設定手順

1. GitHub の該当リポジトリにアクセスします。
2. `Settings` → `Secrets and variables` → `Codespaces` → `Repository secrets` に移動します。
3. `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` を追加します。

シークレットを設定した後、Codespace を作成するか devcontainer を再起動してください。

### Prisma 用環境変数ファイルの作成

Prisma が DB に接続するために `packages/db/.env` が必要です。テンプレートをコピーし、接続情報を設定してください。

```bash
cp packages/db/.env.example packages/db/.env
```

`packages/db/.env` を編集し、各変数に実際の値を設定します。

```
DATABASE_URL="postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>"  
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
