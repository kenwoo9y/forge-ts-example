# 📦 使用技術スタック

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![Turborepo](https://img.shields.io/badge/Turborepo-FF1E56.svg?style=for-the-badge&logo=Turborepo&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA.svg?style=for-the-badge&logo=Biome&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Tamagui](https://img.shields.io/badge/Tamagui-000000?style=for-the-badge&logo=tamagui&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-000000?style=for-the-badge&logo=authjs&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002.svg?style=for-the-badge&logo=Hono&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/-Vitest-252529?style=for-the-badge&logo=vitest&logoColor=FCC72B)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![AWS CDK](https://img.shields.io/badge/AWS_CDK-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

## 🧠 共通設定・言語
- **言語**: TypeScript（全体で統一）
- **実行環境**: Node.js
- **パッケージマネージャー**: pnpm
- **モノレポ管理**: Turborepo
- **コード整形・静的解析**: Biome
- **共通設定**: `packages/config` に Biome / tsconfig を集約

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
- `packages/config`：Biome / tsconfig 設定

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
│   │   ├── public/
│   │   ├── tests/                    # Playwrightテスト
│   │   ├── vitest.config.ts
│   │   ├── playwright.config.ts
|   |   ├── biome.json
|   |   ├── next.config.ts
|   |   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/                       # Expo + React Native
│   │   ├── assets/
│   │   ├── tests/
│   │   ├── vitest.config.ts
|   |   ├── app.json
|   |   ├── package.json
│   │   └── tsconfig.json
│   └── api/                          # Hono（APIサーバー）
│       ├── src/
│       ├── tests/
│       ├── .dockerignore
│       ├── compose.yaml
│       ├── Dockerfile
│       ├── vitest.config.ts
│       ├── package.json
│       └── tsconfig.json

├── packages/
│   ├── ui/                           # UIコンポーネント（shadcn/uiなど）
│   │   ├── src/
│   │   └── package.json
│   ├── db/                           # Prisma + PostgreSQL定義
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   └── client.ts
│   │   └── package.json
│   ├── config/                       # 各種共有設定
│   │   ├── biome/
│   │   │   └── biome.json            # Biome設定
│   │   ├── tsconfig/
│   │   │   └── tsconfig.base.json
│   │   └── vitest/
│   │       └── vitest.config.ts
│   └── auth/                         # Auth.js共有設定など
│       └── src/

├── infra/                            # AWS CDKによるインフラコード
│   ├── bin/
│   │   └── infra.ts
│   ├── lib/
│   │   ├── ecs-fargate.ts
│   │   ├── s3-cloudfront.ts
│   │   └── rds-postgres.ts
│   ├── test/
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json

├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # lint, test, build
│   │   ├── deploy.yml                # CDKデプロイ or ECSデプロイ
│   │   ├── e2e.yml
│   └── dependabot.yml

├── .devcontainer/                    # 開発環境定義（VS Code Remote Container）
│   ├── devcontainer.json
│   ├── Dockerfile
│   └── compose.yaml

├── .biomeignore
├── .gitignore
├── .lefthook.yaml
├── .npmrc
├── biome.json
├── Makefile
├── turbo.json                       # Turborepo設定
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```