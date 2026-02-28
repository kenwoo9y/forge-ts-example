# 認証

## アーキテクチャ概要

```
[ブラウザ]
    │ username / password
    ▼
[Auth.js (Next.js)]  ─── POST /auth/signin ──▶ [Hono API]
    │                                               │ bcrypt 検証
    │ ◀── { token, username } ───────────────────── │ jose で JWT 署名
    │
    │ NextAuth セッション (JWT) に apiToken を格納
    │
    │ API リクエスト時: Authorization: Bearer <token>
    ▼
[Hono API]
    │ jwtMiddleware で Bearer JWT を検証
    ▼
[DB (Prisma / PostgreSQL)]
```

## 認証フロー

1. `/signup` でアカウントを作成（`POST /users` にパスワードを送信、API 側で bcrypt ハッシュ化して保存）
2. `/signin` でログイン → Auth.js が Hono の `POST /auth/signin` を呼び出す
3. Hono が認証成功後に JWT を発行し、Auth.js がセッションに格納
4. 以降の API リクエストでは `Authorization: Bearer <token>` ヘッダーを付与
5. Hono の JWT ミドルウェアがトークンを検証し、保護ルートへのアクセスを制御

## 保護されるルート

| 対象 | 保護レベル |
|---|---|
| `POST /auth/signin` | パブリック |
| `POST /users` | パブリック（サインアップ） |
| `GET /users/:username` | パブリック |
| `GET /tasks`, `PATCH /tasks/*`, `DELETE /tasks/*` | JWT 必須 |
| `GET /users/:username/tasks`, `POST /users/:username/tasks` | JWT 必須 |
| `/todos`（Web） | 認証済みセッション必須 |

## API エンドポイント

### `POST /auth/signin`

ユーザー名とパスワードで認証し、JWT を返します。

```json
// リクエスト
{ "username": "alice", "password": "password123" }

// レスポンス 200
{ "token": "<JWT>", "username": "alice" }

// レスポンス 401
{ "error": "Invalid credentials" }
```

### `POST /users`

アカウントを新規作成します。パスワードは bcrypt（salt rounds: 12）でハッシュ化して保存されます。

```json
// リクエスト
{
  "username": "alice",
  "password": "password123",
  "email": "alice@example.com"
}
```

### JWT 検証ミドルウェア

保護ルートへのリクエストには `Authorization: Bearer <token>` ヘッダーが必要です。トークンが無効または期限切れ（デフォルト 7 日）の場合は `401 Unauthorized` を返します。

## Web ページ

[Auth.js (NextAuth v5)](https://authjs.dev/) の Credentials プロバイダーを使用しています。

| パス | 説明 |
|---|---|
| `/signin` | ログインページ（未認証時のリダイレクト先） |
| `/signup` | アカウント作成ページ |
| `/todos` | 認証済みユーザーのみアクセス可能 |

保護ルートへのアクセスは `middleware.ts` でセッションの有無をチェックします。

## セッションの取得

```ts
// サーバーコンポーネント
import { auth } from "@/auth";
const session = await auth();
const token = session?.apiToken;

// クライアントコンポーネント
import { useSession } from "next-auth/react";
const { data: session } = useSession();
const token = session?.apiToken;
```
