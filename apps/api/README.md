# api

Hono ベースの REST API サーバー。Prisma で PostgreSQL に接続し、Zod OpenAPI でスキーマ管理・ドキュメント自動生成を行う。

## 起動

モノレポのルートから `pnpm dev` で全アプリを一括起動できます。単体で起動する場合:

```bash
cd apps/api
pnpm dev
```

## URL

| 用途 | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| OpenAPI JSON | http://localhost:3000/openapi.json |

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー起動（ホットリロード） |
| `pnpm build` | TypeScript をコンパイル |
| `pnpm start` | ビルド済みサーバーを起動 |
| `pnpm type-check` | 型チェック |
| `pnpm test` | テスト実行 |
| `pnpm test:coverage` | カバレッジ付きテスト実行 |

## 主要な依存関係

- [Hono](https://hono.dev) — Web フレームワーク
- [Prisma](https://www.prisma.io) — ORM
- [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) — スキーマ定義・OpenAPI ドキュメント生成
- [Pino](https://getpino.io) — ロガー
- [jose](https://github.com/panva/jose) — JWT 署名・検証
