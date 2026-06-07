# インフラアーキテクチャ

AWS CDK (TypeScript) で定義されている。グローバルスタック 2 つ（`EcrStack`・`PipelineStack`）と、環境ごとのスタック 4 つ（`NetworkStack`・`DatabaseStack`・`ApiStack`・`WebStack`）で構成される。DEV 環境は常に作成され、STG・PROD は CDK コンテキスト（`enableStg` / `enableProd`）で有効化する。

## システム概要

```mermaid
graph TB
    subgraph "External Actors"
        DEV[Developer]
    end

    subgraph "Infrastructure Management (AWS CDK)"
        CDK_APP["CDK App<br/>bin/infra.ts"]
        NETWORK_STACK["NetworkStack<br/>stacks/network-stack.ts"]
        DATABASE_STACK["DatabaseStack<br/>stacks/database-stack.ts"]
        API_STACK["ApiStack<br/>stacks/api-stack.ts"]
        WEB_STACK["WebStack<br/>stacks/web-stack.ts"]
        ECR_STACK["EcrStack<br/>stacks/ecr-stack.ts"]
        PIPELINE_STACK["PipelineStack<br/>stacks/pipeline-stack.ts"]
    end

    subgraph "Amazon Web Services"
        VPC["VPC<br/>Virtual Private Cloud"]
        ALB_API["ALB<br/>API Traffic Distribution"]
        ALB_WEB["ALB<br/>Web Traffic Distribution"]
        ECS_API["ECS Fargate<br/>Hono API :3000"]
        ECS_WEB["ECS Fargate<br/>Next.js Web :3001"]
        RDS["RDS PostgreSQL 16<br/>task_db :5432"]
        ECR["Amazon ECR<br/>Container Registry"]
        SM["Secrets Manager<br/>DB credentials / JWT secret"]
        CODEPIPELINE["CodePipeline<br/>App / Infra Pipeline"]
    end

    subgraph "CI/CD Pipeline"
        GITHUB["GitHub Repository"]
        GITHUB_ACTIONS["GitHub Actions<br/>CI / Deploy"]
        DEPENDABOT["Dependabot<br/>Dependency Updates"]
    end

    %% Development Flow
    DEV --> CDK_APP
    CDK_APP --> NETWORK_STACK
    CDK_APP --> DATABASE_STACK
    CDK_APP --> API_STACK
    CDK_APP --> WEB_STACK
    CDK_APP --> ECR_STACK
    CDK_APP --> PIPELINE_STACK

    %% Infrastructure Resources
    NETWORK_STACK --> VPC
    DATABASE_STACK --> RDS
    DATABASE_STACK --> SM
    API_STACK --> ALB_API
    API_STACK --> ECS_API
    WEB_STACK --> ALB_WEB
    WEB_STACK --> ECS_WEB
    ECR_STACK --> ECR
    PIPELINE_STACK --> CODEPIPELINE

    %% Service Connections
    ALB_API --> ECS_API
    ALB_WEB --> ECS_WEB
    ECS_API --> RDS
    ECS_API --> SM
    ECS_WEB --> ALB_API
    ECS_API --> ECR
    ECS_WEB --> ECR

    %% CI/CD
    DEV --> GITHUB
    GITHUB --> GITHUB_ACTIONS
    GITHUB_ACTIONS --> ECR
    DEPENDABOT --> GITHUB

    %% Styles
    classDef actorClass fill:#ffebee
    classDef infraClass fill:#e1f5fe
    classDef awsClass fill:#ff9900
    classDef ciCdClass fill:#e8f5e8

    class DEV actorClass
    class CDK_APP,NETWORK_STACK,DATABASE_STACK,API_STACK,WEB_STACK,ECR_STACK,PIPELINE_STACK infraClass
    class VPC,ALB_API,ALB_WEB,ECS_API,ECS_WEB,RDS,ECR,SM,CODEPIPELINE awsClass
    class GITHUB,GITHUB_ACTIONS,DEPENDABOT ciCdClass
```

---

## スタック依存関係

```mermaid
graph LR
    NS[NetworkStack] --> DS[DatabaseStack]
    NS --> AS[ApiStack]
    NS --> WS[WebStack]
    DS --> AS
    AS --> WS
    ECR[EcrStack] --> PS[PipelineStack]
    WS --> PS
```

| スタック | ファイル | スコープ | 役割 |
|---|---|---|---|
| `EcrStack` | `lib/stacks/ecr-stack.ts` | グローバル | ECR リポジトリ（api / web × 環境） |
| `PipelineStack` | `lib/stacks/pipeline-stack.ts` | グローバル | CodePipeline（アプリ・インフラデプロイ）※GitHub Actions へ移行予定 |
| `NetworkStack` | `lib/stacks/network-stack.ts` | 環境ごと | VPC・サブネット・セキュリティグループ |
| `DatabaseStack` | `lib/stacks/database-stack.ts` | 環境ごと | RDS PostgreSQL・DB 認証情報 |
| `ApiStack` | `lib/stacks/api-stack.ts` | 環境ごと | Hono API サーバー (ECS Fargate) |
| `WebStack` | `lib/stacks/web-stack.ts` | 環境ごと | Next.js フロントエンド (ECS Fargate) |

---

## アーキテクチャ全体図

```mermaid
graph TB
    Internet(("Internet"))

    subgraph VPC["VPC（デフォルト: 2 AZ）"]
        subgraph Public["Public Subnets（AZ-a / AZ-c）"]
            NAT["NAT Gateway"]
            WebALB["Web ALB\nport 80"]
            ApiALB["API ALB\nport 80"]
        end

        subgraph Private["Private Subnets（AZ-a / AZ-c）"]
            WebECS["Web ECS Fargate\nNext.js  :3001"]
            ApiECS["API ECS Fargate\nHono  :3000"]
            RDS[("RDS PostgreSQL 16\ntask_db  :5432")]
        end
    end

    SM[("Secrets Manager\nDB credentials / JWT secret")]

    Internet -->|"HTTP :80"| WebALB
    Internet -->|"HTTP :80"| ApiALB
    WebALB -->|":3001"| WebECS
    ApiALB -->|":3000"| ApiECS
    WebECS -->|"API_URL  HTTP :80"| ApiALB
    ApiECS -->|":5432"| RDS
    ApiECS -->|"read"| SM
    Private -->|"outbound"| NAT
    NAT --> Internet
```

---

## セキュリティグループ

ALB・ECS のセキュリティグループは `ApplicationLoadBalancedFargateService` パターンが自動生成する。
RDS セキュリティグループは `NetworkStack` で定義し、`ApiStack` 内で `CfnSecurityGroupIngress` を使って API ECS SG からのインバウンドルールを追加している。

```mermaid
flowchart LR
    Internet["0.0.0.0/0"]

    subgraph WebRoute["Web ルート"]
        WebALB_SG["Web ALB SG\nInbound: TCP 80\nOutbound: all"]
        WebECS_SG["Web ECS SG\nInbound: TCP 3001 from Web ALB SG\nOutbound: all"]
    end

    subgraph ApiRoute["API ルート"]
        ApiALB_SG["API ALB SG\nInbound: TCP 80\nOutbound: all"]
        ApiECS_SG["API ECS SG\nInbound: TCP 3000 from API ALB SG\nOutbound: all"]
    end

    RDS_SG["RDS SG\nInbound: TCP 5432 from API ECS SG\nOutbound: none"]

    Internet --> WebALB_SG --> WebECS_SG
    Internet --> ApiALB_SG --> ApiECS_SG
    ApiECS_SG --> RDS_SG
```

---

## スタック詳細

### EcrStack

環境ごとに api / web の ECR リポジトリペアを管理するグローバルスタック。DEV は常に作成され、STG・PROD はコンテキストフラグで制御する。

| 項目 | 値 |
|---|---|
| リポジトリ名 | `forge-ts/api-{env}` / `forge-ts/web-{env}` |
| イメージスキャン | プッシュ時に自動実行（`imageScanOnPush: true`） |
| ライフサイクルルール | 最新 20 イメージのみ保持 |
| 削除ポリシー | `RETAIN`（スタック削除時もリポジトリは残る） |

| 環境 | 有効化条件 |
|---|---|
| DEV | 常時 |
| STG | `enableStg: true` |
| PROD | `enableProd: true` |

### PipelineStack

> **移行予定**: CodePipeline + CodeStar Connections から GitHub Actions + OIDC へ移行予定。詳細は [deploy.md](./deploy.md) を参照。

アプリ・インフラのデプロイパイプラインを管理するグローバルスタック。CodeStar Connections 経由で GitHub を Source とし、ECS Blue/Green デプロイと CDK デプロイを実行する。

### NetworkStack

- **VPC**: パブリック・プライベートサブネット各 AZ、NAT Gateway 1 台
- セキュリティグループを 3 つ定義し、下位スタックへ渡す

| セキュリティグループ | インバウンド | アウトバウンド |
|---|---|---|
| `albSecurityGroup` | TCP 80, 443 (0.0.0.0/0) | all |
| `ecsSecurityGroup` | TCP 3000 from ALB SG | all |
| `rdsSecurityGroup` | TCP 5432 from ECS SG | なし |

> `albSecurityGroup` / `ecsSecurityGroup` は現在 NetworkStack のみで定義されており、各スタックの ECS サービスには `ApplicationLoadBalancedFargateService` が自動生成した SG が適用される。`rdsSecurityGroup` は DatabaseStack・ApiStack に渡され実際に使われる。

### DatabaseStack

- RDS PostgreSQL 16 をプライベートサブネットに配置
- DB 認証情報は Secrets Manager (`DatabaseSecret`) に自動保存
- `rdsSecurityGroup` を RDS インスタンスに適用

| 項目 | 値 |
|---|---|
| DB 名 | `task_db` |
| ユーザー | `postgres` |
| ストレージ | 20 GB（最大 100 GB まで自動スケール） |
| Multi-AZ | 無効 |

### ApiStack

- `EcsFargateService` コンストラクト（`lib/constructs/ecs-fargate-service.ts`）を利用して ALB + Fargate を構築
- RDS 接続情報と JWT シークレットを Secrets Manager から起動時に注入
- `CfnSecurityGroupIngress` で API ECS SG → RDS SG (:5432) のインバウンドルールを追加
- タスクロールに DB 認証情報・JWT シークレットの `secretsmanager:GetSecretValue` を付与

```
環境変数: DB_HOST, DB_PORT, DB_NAME, NODE_ENV
シークレット: DB_USERNAME, DB_PASSWORD (DatabaseSecret), JWT_SECRET (jwt-secret)
```

### WebStack

- `EcsFargateService` コンストラクトを利用して ALB + Fargate を構築
- `API_URL` には ApiStack の ALB DNS 名を渡す（デプロイ時に動的解決）

```
環境変数: API_URL (http://<API ALB DNS>), NODE_ENV
```

---

## 再利用コンストラクト: EcsFargateService

`lib/constructs/ecs-fargate-service.ts` — ApiStack・WebStack で共通利用する ALB + ECS Fargate のパターン。

```mermaid
graph LR
    Props["Props\n(vpc, image, containerPort\nenvironment, secrets, cpu, memory)"]
    Cluster["ECS Cluster"]
    AlbFs["ApplicationLoadBalancedFargateService\n(ALB + TaskDef + Service + TargetGroup)"]
    HC["Health Check\nPATH: /  codes: 200-399\ninterval: 30s  threshold: 2/3"]

    Props --> Cluster
    Props --> AlbFs
    Cluster --> AlbFs
    AlbFs --> HC
```

---

## 設定パラメータ

デプロイ時に環境変数で調整できる。

| 環境変数 | デフォルト | 説明 |
|---|---|---|
| `MAX_AZS` | `2` | 使用する AZ 数 |
| `DB_INSTANCE_TYPE` | `t3.micro` | RDS インスタンスタイプ |
| `DB_ALLOCATED_STORAGE` | `20` | 初期ストレージ (GB) |
| `DB_MAX_ALLOCATED_STORAGE` | `100` | 自動スケール上限 (GB) |
| `API_CPU` | `256` | API タスクの CPU ユニット |
| `API_MEMORY_MIB` | `512` | API タスクのメモリ (MiB) |
| `API_DESIRED_COUNT` | `1` | API タスクの起動数 |
| `WEB_CPU` | `256` | Web タスクの CPU ユニット |
| `WEB_MEMORY_MIB` | `512` | Web タスクのメモリ (MiB) |
| `WEB_DESIRED_COUNT` | `1` | Web タスクの起動数 |
