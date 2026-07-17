# LIFF ギフトカードアプリ

LINE の LIFF 上で動作するギフトカードアプリです。

## 機能

1. **LINE アカウントでログイン** — LIFF SDK によるログインと、サーバー側での ID トークン検証
2. **ギフト機能**
   - ユーザー A がカスタムカードを作成（デザイン選択 + メッセージ入力）
   - シェアターゲットピッカー（または URL コピー）でユーザー B に送信
   - ユーザー B が「このカードを使用する」ボタンを押すと DB が使用済みに更新され、再利用不可になる
3. **リッチメニューのカスタム** — スクリプト一発で作成・画像アップロード・デフォルト設定

## 技術スタック

- Next.js 15 (App Router) + TypeScript
- @line/liff（フロントのログイン・シェア）
- Prisma + SQLite（ギフトカードの状態管理）
- LINE Messaging API（リッチメニュー）

## セットアップ

### 1. LINE Developers での準備

[LINE Developers コンソール](https://developers.line.biz/console/) で、同じプロバイダー配下に 2 つのチャネルを用意します。

**a. LINE ログインチャネル（LIFF 用）**

1. チャネルを作成し、「LIFF」タブから LIFF アプリを追加
   - サイズ: Full
   - エンドポイント URL: アプリの公開 URL（開発時は ngrok などの HTTPS URL）
   - スコープ: `profile` と `openid` を **両方オン**（openid が無いと ID トークンが取れず API が動きません）
   - シェアターゲットピッカー: オン
2. `LIFF ID`（例 `1234567890-abcdefgh`）と、チャネル基本設定の `チャネル ID` を控える

**b. Messaging API チャネル（公式アカウント / リッチメニュー用）**

1. Messaging API チャネルを作成（＝公式アカウントができます）
2. 「Messaging API 設定」タブでチャネルアクセストークン（長期）を発行して控える
3. テストに使う LINE アカウントでこの公式アカウントを友だち追加しておく

### 2. 環境変数

```bash
cp .env.example .env
```

`.env` を編集:

| 変数 | 内容 |
| --- | --- |
| `NEXT_PUBLIC_LIFF_ID` | LIFF アプリの ID |
| `LINE_LOGIN_CHANNEL_ID` | LINE ログインチャネルのチャネル ID（ID トークン検証用） |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | Messaging API チャネルのアクセストークン（リッチメニュー用） |
| `DATABASE_URL` | そのまま `file:./dev.db` で OK |

### 3. インストールと DB 初期化

```bash
npm install
npx prisma migrate dev --name init
```

### 4. 開発サーバー起動

```bash
npm run dev
```

LIFF は HTTPS が必須なので、開発時はトンネルを併用します:

```bash
ngrok http 3000
```

表示された `https://xxxx.ngrok-free.app` を LIFF のエンドポイント URL に設定し、
`https://liff.line.me/{LIFF_ID}` を LINE のトーク画面から開いて動作確認します。

### 5. リッチメニューの設定

```bash
npm run richmenu:setup
```

- 「カードを作る / 送ったカード / ホーム」の 3 分割メニューを作成し、全ユーザーのデフォルトに設定します
- `scripts/richmenu.png`（2500×843 px）を置くとその画像を使用、無ければ自動生成します
- 再実行すると同名の古いメニューを削除して作り直します

## ギフトの流れ

```
ユーザーA                          サーバー / DB                ユーザーB
   │ カード作成(テンプレ+文面) ──▶ GiftCard 作成 (ACTIVE)
   │ シェア/URLコピー
   │   https://liff.line.me/{LIFF_ID}/gift/{token}
   │ ──────────────── LINE で送信 ────────────────▶ │
   │                                                │ リンクを開く(LINEログイン)
   │                                                │ 「使用する」をタップ
   │                     updateMany(token, ACTIVE→USED) ◀──┘
   │                     ※ 条件付き更新なので二重使用は 409
```

- 使用処理は `updateMany({ where: { token, status: "ACTIVE" } })` による条件付き更新のため、同時に複数回押されても 1 回しか成功しません
- 使用済みカードを開くと「使用済み」オーバーレイが表示されます

### 友だち追加の義務付け

カードの使用には**公式アカウント（Messaging API チャネル）の友だち追加が必須**です。

- サーバー側で Messaging API のプロフィール取得（友だちでなければ 404 が返る）を使って判定し、未友だちの使用リクエストは 403 で拒否します
- 受け取り画面では未友だちの場合に「友だち追加する」ボタン（`NEXT_PUBLIC_OA_ADD_FRIEND_URL`）と再読み込みボタンを表示します
- この判定が機能する前提として、**ミニアプリ（LINEログイン）チャネルと Messaging API チャネルが同じプロバイダー配下**である必要があります（userId が共通になるため）。また `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` の設定が必須です
- 制限: 一度友だち追加した後にブロックしたユーザーは、Messaging API の仕様上「友だち」と判定される場合があります

## API

| メソッド / パス | 説明 |
| --- | --- |
| `POST /api/cards` | カード作成（要 ID トークン） |
| `GET /api/cards` | 自分が作成したカード一覧 |
| `GET /api/gift/[token]` | カード内容の取得 |
| `POST /api/gift/[token]/use` | カードの使用（使用済みなら 409、公式アカウント未友だちなら 403） |

すべての API は `Authorization: Bearer <LIFF の ID トークン>` を必須とし、
サーバー側で LINE の [verify エンドポイント](https://developers.line.biz/ja/reference/line-login/#verify-id-token)により検証します。

## 本番運用に向けたメモ

- SQLite → PostgreSQL などへは `prisma/schema.prisma` の `datasource` を変更するだけで移行できます
- 現状はリンクを知っていれば誰でも（送信者本人でも）使用できます。特定の受取人に限定したい場合は、初回に開いたユーザーの `userId` を `recipientId` として固定するなどの拡張ができます
- シェアターゲットピッカーは LINE アプリ内（LIFF ブラウザ）でのみ動作します。外部ブラウザでは「リンクをコピー」を使ってください
