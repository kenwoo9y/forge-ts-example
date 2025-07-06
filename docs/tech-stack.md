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
- 実装例：`platype-example`


## ディレクトリ構成
```
forge-ts/
├── .devcontainer/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   ├── e2e.yml
│   │   └── test.yml
│   └── dependabot.yml
├── apps/
│   ├── web/                        # Next.js App Router
│   │   ├── app/                    # pages/api は使わない
│   │   ├── components/
│   │   ├── e2e/                    # Playwright テスト
│   │   ├── tests/                  # Vitest ユニットテスト
│   │   ├── storybook/
│   │   ├── playwright.config.ts
│   │   └── tsconfig.json
│   ├── mobile/                    # Expo + Tamagui
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── tests/                 # Vitest
│   │   └── storybook/
│   └── api/                       # Hono バックエンド（REST / Edge対応）
│       ├── src/
│       │   ├── routes/
│       │   ├── middlewares/
│       │   ├── handlers/
│       │   └── server.ts
│       ├── tests/                 # Vitest テスト
│       ├── Dockerfile             # ECS 用
│       └── tsconfig.json
├── packages/
│   ├── config/                    # ESLint, Prettier, tsconfig 共通設定
│   │   ├── eslint/
│   │   ├── prettier/
│   │   └── tsconfig/
│   ├── db/                        # Prismaスキーマとクライアント
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── migrations/
│   │   ├── scripts/
│   │   │   └── seed.ts
│   │   └── index.ts               # Prisma Client Export
│   ├── ui/                        # Tamagui UI共通コンポーネント
│   │   ├── button.tsx
│   │   ├── theme.ts
│   │   └── tamagui.config.ts
│   └── auth/                      # Auth.js ヘルパー
│       └── getSession.ts
├── docker/                        # Dev用 + ECS用Docker関連
│   ├── api/Dockerfile
│   ├── db/Dockerfile
│   └── docker-compose.yml
├── vitest.config.ts              # ルート設定（または各パッケージ別）
├── .eslintrc.cjs
├── .prettierrc.cjs
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md

```