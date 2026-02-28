# 📦 使用技術スタック

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![Turborepo](https://img.shields.io/badge/Turborepo-FF1E56.svg?style=for-the-badge&logo=Turborepo&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA.svg?style=for-the-badge&logo=Biome&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Shadcn/ui](https://img.shields.io/badge/shadcn/ui-%23000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-%23EC5990.svg?style=for-the-badge&logo=reacthookform&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-000000.svg?style=for-the-badge&logo=TanStack&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-000000?style=for-the-badge&logo=authjs&logoColor=white)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002.svg?style=for-the-badge&logo=Hono&logoColor=white)
![pino](https://img.shields.io/badge/pino-687634.svg?style=for-the-badge&logo=pino&logoColor=white)
![Zod](https://img.shields.io/badge/zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Vitest](https://img.shields.io/badge/-Vitest-252529?style=for-the-badge&logo=vitest&logoColor=FCC72B)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![AWS CDK](https://img.shields.io/badge/AWS_CDK-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Dependabot](https://img.shields.io/badge/dependabot-025E8C?style=for-the-badge&logo=dependabot&logoColor=white)
![Lefthook](https://img.shields.io/badge/Lefthook-FF1E1E.svg?style=for-the-badge&logo=Lefthook&logoColor=white)
![commitlint](https://img.shields.io/badge/commitlint-000000.svg?style=for-the-badge&logo=commitlint&logoColor=white)

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
- **CSSフレームワーク**: TailwindCSS v4
- **UIライブラリ**: shadcn/ui（Radix UI + class-variance-authority）
- **フォーム**: React Hook Form + Zod
- **データフェッチ**: TanStack Query
- **テーブル**: TanStack Table
- **認証**: Auth.js（NextAuth v5）Credentials プロバイダー
- **テスト**:
  - 単体テスト: Vitest（予定）
  - E2Eテスト: Playwright（予定）
  - UIドキュメント: Storybook（予定）

---

## 📱 モバイル
- **フレームワーク**: React Native + Expo
- **テスト**:
  - 単体テスト: Vitest
  - UIドキュメント: Storybook（任意）

---

## 🌐 バックエンド（API）
- **フレームワーク**: Hono（@hono/zod-openapi、@hono/swagger-ui）
- **認証**: bcryptjs（パスワードハッシュ化）+ jose（JWT 署名・検証）
- **ロギング**: pino + hono-pino
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
- `packages/db`：Prisma ORM / DBクライアント
- `packages/auth`：bcryptjs + Zod による認証バリデーション共通ロジック
- `packages/schema`：Zod スキーマ共有（API・Web 間）
- `packages/config`：Biome / tsconfig / vitest 設定

---

## 🧱 プロジェクト名
- テンプレート名称：`forge-ts`
- 実装例：`forge-ts-example`


## ディレクトリ構成
```
forge-ts-example/
├── apps/
│   ├── web/                          # Next.js (Webフロントエンド)
│   │   ├── app/                      # App Router
│   │   ├── components/               # 共通コンポーネント（shadcn/ui 含む）
│   │   ├── features/                 # 機能単位のモジュール
│   │   ├── lib/                      # ユーティリティ・API クライアント
│   │   ├── types/
│   │   ├── public/
│   │   ├── auth.ts                   # Auth.js 設定
│   │   ├── biome.json
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/                       # Expo + React Native
│   │   ├── assets/
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                          # Hono（APIサーバー）
│       ├── src/
│       │   ├── application/
│       │   ├── domain/
│       │   ├── infrastructure/
│       │   └── presentation/
│       ├── .dockerignore
│       ├── compose.yaml
│       ├── Dockerfile
│       ├── vitest.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── db/                           # Prisma + PostgreSQL定義
│   │   ├── generated/prisma/         # 生成された Prisma クライアント
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   └── schema.prisma
│   │   ├── prisma.config.ts
│   │   └── package.json
│   ├── auth/                         # 認証共通ロジック（bcryptjs + Zod）
│   │   └── src/
│   ├── schema/                       # Zod スキーマ共有（API・Web 間）
│   │   └── src/
│   └── config/                       # 各種共有設定
│       ├── biome/
│       ├── tsconfig/
│       └── vitest/
│
├── infra/                            # AWS CDK によるインフラコード（予定）
│   ├── bin/
│   ├── lib/
│   ├── test/
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── dependabot.yaml
│   └── pull_request_template.md
│
├── .devcontainer/                    # 開発環境定義（VS Code Dev Container）
│   ├── compose.yaml
│   ├── compose.override.yaml
│   ├── devcontainer.json
│   └── Dockerfile
│
├── .biomeignore
├── .gitignore
├── .lefthook.yaml
├── .npmrc
├── biome.json
├── commitlint.config.js
├── cspell.json
├── Makefile
├── turbo.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```
