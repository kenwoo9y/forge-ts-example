# forge-ts-example

## 開発環境 (Codespaces / ローカル)

このリポジトリでは PostgreSQL の接続情報を環境変数で渡す必要があります。

- Codespaces: リポジトリ（または組織）の Codespaces シークレットとして `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` を設定してください。devcontainer はこれらのシークレットを優先して使います。
- ローカル: リポジトリにコミットしないファイル `.devcontainer/.env` を作成し、同じ環境変数を定義してください。テンプレートは `.devcontainer/.env.example` にあります。

devcontainer は起動時に必要な環境変数が揃っていることをチェックします。変数が不足している場合はセットアップを中止し、Codespaces のシークレットを設定するか、ローカルで `.devcontainer/.env` を作成するよう指示されます。

例: `.devcontainer/.env`

POSTGRES_DB=forge_ts_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

### Codespaces シークレットの設定手順

1. GitHub の該当リポジトリにアクセスします。
2. `Settings` → `Secrets and variables` → `Codespaces` → `Repository secrets` に移動します。
3. `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` を追加します。

シークレットを設定した後、Codespace を作成するか devcontainer を再起動してください。
