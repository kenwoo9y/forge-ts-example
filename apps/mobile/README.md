# mobile

Expo ベースのモバイルアプリ。NativeWind でスタイリング、TanStack Query でサーバー状態管理、React Hook Form でフォーム管理を行う。

## 起動

モノレポのルートから `pnpm dev` で全アプリを一括起動できます。単体で起動する場合:

```bash
cd apps/mobile
pnpm dev
```

起動後、Expo Go アプリ（iOS / Android）で QR コードをスキャンして接続します。

## URL

| 用途 | URL |
|---|---|
| Expo Dev Tools | http://localhost:8081 |
| Storybook | http://localhost:6007 |

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm ios` | iOS シミュレーターで起動 |
| `pnpm android` | Android エミュレーターで起動 |
| `pnpm web` | ブラウザで起動 |
| `pnpm type-check` | 型チェック |
| `pnpm test` | テスト実行 |
| `pnpm test:coverage` | カバレッジ付きテスト実行 |
| `pnpm storybook` | Storybook 起動 |

## 主要な依存関係

- [Expo](https://expo.dev) — モバイルアプリ基盤
- [React Native](https://reactnative.dev) — UI フレームワーク
- [Expo Router](https://expo.github.io/router) — ファイルベースルーティング
- [NativeWind](https://www.nativewind.dev) — Tailwind CSS ベースのスタイリング
- [TanStack Query](https://tanstack.com/query) — サーバー状態管理
- [React Hook Form](https://react-hook-form.com) — フォーム管理
- [Zod](https://zod.dev) — バリデーション
