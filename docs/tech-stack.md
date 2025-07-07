# 📦 使用技術スタック

## 🧠 共通設定・言語
- **言語**: TypeScript（全体で統一）
- **パッケージマネージャー**: pnpm
- **モノレポ管理**: Turborepo
- **コード整形**: Prettier
- **静的解析**: ESLint
- **共通設定**: `packages/config` に ESLint / Prettier / tsconfig を集約

---

## 🖥 フロントエンド（Web）
- **フレームワーク**: Next.js（App Router）
- **UIライブラリ**: Tamagui（モバイルと共通）
- **認証**: Auth.js（NextAuth.js）+ Prisma Adapter
- **テスト**:
  - 単体テスト: Vitest
  - E2Eテスト: Playwright
  - UIドキュメント: Storybook

---

## 📱 モバイル
- **フレームワーク**: React Native + Expo
- **UIライブラリ**: Tamagui（Webと共通）
- **テスト**:
  - 単体テスト: Vitest
  - UIドキュメント: Storybook（任意）

---

## 🌐 バックエンド（API）
- **フレームワーク**: Hono
- **認証**: Auth.js を共有ロジックで統合
- **Docker対応**: ECSデプロイ用Dockerfileあり
- **テスト**: Vitest

---

## 🛢 データベース・ORM
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **構成**:
  - Prisma schema: `packages/db/prisma/schema.prisma`
  - マイグレーション: `packages/db/migrations`
  - シードスクリプト: `packages/db/scripts/seed.ts`

---

## ☁️ インフラ / デプロイ
- **IaC**: AWS CDK
- **構成**:
  - Web: S3 + CloudFront
  - API: ECS + Fargate
- **Docker**: Dev用・本番用をそれぞれ定義
- **CI/CD**: GitHub Actions

---

## 🧪 テスト / CI / DevOps
- **単体テスト**: Vitest（Web / Mobile / API / Packages）
- **E2Eテスト**: Playwright（主にWeb UI対象）
- **CI/CD**:
  - GitHub Actions: lint / test / deploy / e2e
  - Dependabot: 依存パッケージの自動更新

---

## 💻 開発環境
- **Dev Container**: `.devcontainer/` に Dockerfile + docker-compose を配置
- **ローカル環境構築**:
  - API・DBを含むローカル実行環境は docker-compose で起動可能

---

## 📁 パッケージ構成
- `apps/web`：Next.js App Router
- `apps/mobile`：React Native + Expo
- `apps/api`：Hono API
- `packages/ui`：Tamagui UI コンポーネント共通化
- `packages/db`：Prisma ORM / DBクライアント
- `packages/auth`：Auth.js関連のロジック共通化
- `packages/config`：ESLint / Prettier / tsconfig 設定

---

## 🧱 プロジェクト名
- テンプレート名称：`forge-ts`
- 実装例：`forge-ts-example`


## ディレクトリ構成
```
forge-ts/
├── apps/
│   ├── web/                          # Next.js (Webフロントエンド)
│   │   ├── app/                      # App Router構成
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── styles/
│   │   ├── tests/                    # Playwrightテスト
│   │   ├── vitest.config.ts
│   │   ├── playwright.config.ts
│   │   └── tsconfig.json
│   ├── mobile/                       # Expo + React Native
│   │   ├── app/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── tests/
│   │   └── tsconfig.json
│   └── api/                          # Hono（APIサーバー）
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   └── index.ts
│       ├── tests/
│       ├── vitest.config.ts
│       └── tsconfig.json

├── packages/
│   ├── ui/                           # UIコンポーネント（shadcn/uiなど）
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── db/                           # Prisma + PostgreSQL定義
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   └── client.ts
│   │   └── tsconfig.json
│   ├── config/                       # 各種共有設定
│   │   ├── eslint/
│   │   │   └── eslint.config.js      # Flat Config方式
│   │   ├── prettier/
│   │   │   └── .prettierrc
│   │   ├── tsconfig/
│   │   │   └── tsconfig.base.json
│   │   └── vitest/
│   │       └── vitest.config.ts
│   └── auth/                         # Auth.js共有設定など
│       └── src/

├── infra/                            # AWS CDKによるインフラコード
│   ├── bin/
│   │   └── forge-ts.ts
│   ├── lib/
│   │   ├── ecs-fargate.ts
│   │   ├── s3-cloudfront.ts
│   │   └── rds-postgres.ts
│   └── cdk.json

├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # lint, test, build
│   │   ├── deploy.yml                # CDKデプロイ or ECSデプロイ
│   │   ├── e2e.yml
│   └── dependabot.yml

├── .devcontainer/                    # 開発環境定義（VS Code Remote Container）
│   ├── devcontainer.json
│   ├── Dockerfile
│   └── docker-compose.yml

├── tsconfig.base.json               # 共有tsconfig（旧形式でトップにも）
├── turbo.json                       # Turborepo設定
├── package.json
├── pnpm-workspace.yaml
└── README.md
```