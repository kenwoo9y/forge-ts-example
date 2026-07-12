# infra

AWS CDK（TypeScript）によるインフラ定義。VPC・RDS・ECS Fargate を複数スタックで管理する。スタック構成・使用しているAWSサービスの詳細は [インフラアーキテクチャ](../docs/infra-architecture.md) を参照。

## 事前準備

AWS SSO でログインする（`.devcontainer/.env` に SSO 設定が必要）。

```bash
make aws-login
```

CDK を初めて使う環境ではブートストラップが必要。

```bash
make cdk-bootstrap
```

## デプロイコマンド

| コマンド | 内容 |
|---|---|
| `pnpm exec cdk deploy --all -c githubOrg=<org> -c githubRepo=<repo>` | 全スタックをデプロイ（初回・DEV のみ） |
| `pnpm exec cdk deploy --all -c enableStg=true -c githubOrg=<org> -c githubRepo=<repo>` | STG を追加してデプロイ |
| `pnpm exec cdk deploy --all -c enableStg=true -c enableProd=true -c githubOrg=<org> -c githubRepo=<repo>` | PROD を追加してデプロイ |
| `pnpm cdk deploy DevNetworkStack` | 指定スタックのみデプロイ |
| `pnpm cdk destroy` | 全スタックを削除 |
