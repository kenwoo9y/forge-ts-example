# infra

AWS CDK（TypeScript）によるインフラ定義。VPC・RDS・ECS Fargate を複数スタックで管理する。

## スタック構成

| スタック | 内容 |
|---|---|
| `EcrStack` | 全環境共通の ECR リポジトリ（API・Web × DEV/STG/PROD） |
| `PipelineStack` | GitHub Actions OIDC ロール（ECR push・cdk deploy・cdk diff 用） |
| `{Env}NetworkStack` | VPC・サブネット・セキュリティグループ（環境ごと） |
| `{Env}DatabaseStack` | RDS PostgreSQL（プライベートサブネット）・Secrets Manager 認証情報（環境ごと） |
| `{Env}ApiStack` | Hono API の ECS Fargate サービス・ALB（環境ごと） |
| `{Env}WebStack` | Next.js Web の ECS Fargate サービス・ALB（環境ごと） |

環境プレフィックス `{Env}` は `Dev` / `Stg` / `Prod`。STG・PROD は `enableStg=true` / `enableProd=true` コンテキストで有効化します。

## 使用している AWS サービス

| サービス | 用途 |
|---|---|
| Amazon VPC | プライベート/パブリックサブネット、セキュリティグループ、NAT ゲートウェイ |
| Amazon ECS (Fargate) | API・Web コンテナのサーバーレス実行基盤 |
| Application Load Balancer | API・Web への HTTP トラフィック分散 |
| Amazon RDS (PostgreSQL) | タスクデータの永続化（プライベートサブネット配置） |
| AWS Secrets Manager | DB 認証情報・JWT シークレットの安全な管理 |
| Amazon ECR | コンテナイメージのレジストリ（API・Web × 環境別） |
| AWS IAM (OIDC) | GitHub Actions が AWS にアクセスするための OIDC 連携ロール |

## 事前準備

AWS SSO でログインする（`.devcontainer/.env` に SSO 設定が必要）。

```bash
make aws-login
```

CDK を初めて使う環境ではブートストラップが必要。

```bash
make cdk-bootstrap
```

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `pnpm build` | TypeScript をコンパイル |
| `pnpm watch` | ファイル変更を監視してコンパイル |
| `pnpm type-check` | 型チェック |
| `pnpm test` | スタックの単体テストを実行 |
| `pnpm test:coverage` | カバレッジ付きテスト実行 |
| `pnpm cdk synth` | CloudFormation テンプレートを生成 |
| `pnpm cdk diff` | デプロイ済みスタックと現在の差分を表示 |
| `pnpm exec cdk deploy --all -c githubOrg=<org> -c githubRepo=<repo>` | 全スタックをデプロイ（初回・DEV のみ） |
| `pnpm exec cdk deploy --all -c enableStg=true -c githubOrg=<org> -c githubRepo=<repo>` | STG を追加してデプロイ |
| `pnpm exec cdk deploy --all -c enableStg=true -c enableProd=true -c githubOrg=<org> -c githubRepo=<repo>` | PROD を追加してデプロイ |
| `pnpm cdk deploy DevNetworkStack` | 指定スタックのみデプロイ |
| `pnpm cdk destroy` | 全スタックを削除 |

## 主要な依存関係

- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) — IaC フレームワーク
- [aws-cdk-lib](https://docs.aws.amazon.com/cdk/api/v2/) — CDK コンストラクトライブラリ
