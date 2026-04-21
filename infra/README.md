# infra

AWS CDK（TypeScript）によるインフラ定義。VPC・RDS・ECS Fargate を複数スタックで管理する。

## スタック構成

| スタック | 内容 |
|---|---|
| `NetworkStack` | VPC・サブネット・セキュリティグループ |
| `DatabaseStack` | RDS PostgreSQL（プライベートサブネット）・Secrets Manager 認証情報 |
| `ApiStack` | Hono API の ECS Fargate サービス・ALB |
| `WebStack` | Next.js Web の ECS Fargate サービス・ALB |

## 使用している AWS サービス

| サービス | 用途 |
|---|---|
| Amazon VPC | プライベート/パブリックサブネット、セキュリティグループ、NAT ゲートウェイ |
| Amazon ECS (Fargate) | API・Web コンテナのサーバーレス実行基盤 |
| Application Load Balancer | API・Web への HTTP トラフィック分散 |
| Amazon RDS (PostgreSQL) | タスクデータの永続化（プライベートサブネット配置） |
| AWS Secrets Manager | DB 認証情報・JWT シークレットの安全な管理 |
| Amazon ECR | コンテナイメージのレジストリ（CDK Assets として自動作成） |

## 事前準備

AWS 認証情報が設定されていることを確認してください。

```bash
aws configure
# または
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=ap-northeast-1
```

CDK を初めて使う環境ではブートストラップが必要です。

```bash
pnpm cdk bootstrap
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
| `pnpm cdk deploy` | 全スタックをデプロイ |
| `pnpm cdk deploy NetworkStack` | 指定スタックのみデプロイ |
| `pnpm cdk destroy` | 全スタックを削除 |

## 主要な依存関係

- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) — IaC フレームワーク
- [aws-cdk-lib](https://docs.aws.amazon.com/cdk/api/v2/) — CDK コンストラクトライブラリ
