# web

Next.js ベースの Web アプリ。Auth.js で認証、TanStack Query でサーバー状態管理、Tailwind CSS + shadcn/ui で UI を構築する。

## 起動

モノレポのルートから `pnpm dev` で全アプリを一括起動できます。単体で起動する場合:

```bash
cd apps/web
pnpm dev
```

## URL

| 用途 | URL |
|---|---|
| Web アプリ | http://localhost:3001 |
| Storybook | http://localhost:6006 |

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー起動（Turbopack） |
| `pnpm build` | プロダクションビルド |
| `pnpm start` | ビルド済みサーバーを起動 |
| `pnpm type-check` | 型チェック |
| `pnpm lint` | Biome でリント |
| `pnpm format` | Biome でフォーマット |
| `pnpm test` | テスト実行 |
| `pnpm test:coverage` | カバレッジ付きテスト実行 |
| `pnpm test:storybook` | Storybook のテスト実行 |
| `pnpm storybook` | Storybook 起動 |

## 主要な依存関係

- [Next.js](https://nextjs.org) — Web フレームワーク
- [Auth.js](https://authjs.dev) — 認証
- [TanStack Query](https://tanstack.com/query) — サーバー状態管理
- [React Hook Form](https://react-hook-form.com) — フォーム管理
- [Tailwind CSS](https://tailwindcss.com) — スタイリング
- [Zod](https://zod.dev) — バリデーション
