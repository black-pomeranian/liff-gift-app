/**
 * リッチメニューを作成して全ユーザーのデフォルトに設定するスクリプト。
 *
 *   npm run richmenu:setup
 *
 * 必要な環境変数（.env）:
 *   - LINE_MESSAGING_CHANNEL_ACCESS_TOKEN … Messaging API チャネルのアクセストークン
 *   - NEXT_PUBLIC_LIFF_ID                 … LIFF アプリの ID
 *
 * 画像: scripts/richmenu.png があればそれを使用。
 *       なければ sharp で自動生成（scripts/richmenu.generated.png に保存）。
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const TOKEN = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;

const MENU_NAME = "liff-gift-menu";
const WIDTH = 2500;
const HEIGHT = 843;

if (!TOKEN) {
  console.error("環境変数 LINE_MESSAGING_CHANNEL_ACCESS_TOKEN が設定されていません。");
  process.exit(1);
}
if (!LIFF_ID) {
  console.error("環境変数 NEXT_PUBLIC_LIFF_ID が設定されていません。");
  process.exit(1);
}

// ミニアプリのパーマネントリンク形式。タップするとミニアプリの各ページが開く
const liffUrl = (p: string) => `https://miniapp.line.me/${LIFF_ID}${p}`;

const richMenu = {
  size: { width: WIDTH, height: HEIGHT },
  selected: true,
  name: MENU_NAME,
  chatBarText: "メニュー",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: HEIGHT },
      action: { type: "uri", uri: liffUrl("/cards/new") },
    },
    {
      bounds: { x: 833, y: 0, width: 833, height: HEIGHT },
      action: { type: "uri", uri: liffUrl("/cards") },
    },
    {
      bounds: { x: 1666, y: 0, width: 834, height: HEIGHT },
      action: { type: "uri", uri: liffUrl("/") },
    },
  ],
};

async function api(
  url: string,
  init: RequestInit & { headers?: Record<string, string> } = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init.method ?? "GET"} ${url} failed (${res.status}): ${body}`);
  }
  return res;
}

/** メニュー画像を用意する（手動配置 > 自動生成） */
async function prepareImage(): Promise<Buffer> {
  const manual = path.join(__dirname, "richmenu.png");
  if (fs.existsSync(manual)) {
    console.log(`画像 ${manual} を使用します。`);
    return fs.readFileSync(manual);
  }

  console.log("scripts/richmenu.png が無いため、画像を自動生成します…");
  const panel = (x: number, w: number, color: string, emoji: string, label: string) => `
    <g>
      <rect x="${x}" y="0" width="${w}" height="${HEIGHT}" fill="${color}"/>
      <text x="${x + w / 2}" y="400" font-size="180" text-anchor="middle">${emoji}</text>
      <text x="${x + w / 2}" y="620" font-size="96" font-weight="bold" fill="#ffffff"
        text-anchor="middle" font-family="sans-serif">${label}</text>
    </g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    ${panel(0, 833, "#06C755", "🎁", "カードを作る")}
    ${panel(833, 833, "#00B0FF", "📮", "送ったカード")}
    ${panel(1666, 834, "#455A64", "🏠", "ホーム")}
    <rect x="831" y="0" width="4" height="${HEIGHT}" fill="#ffffff" opacity="0.6"/>
    <rect x="1664" y="0" width="4" height="${HEIGHT}" fill="#ffffff" opacity="0.6"/>
  </svg>`;

  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const out = path.join(__dirname, "richmenu.generated.png");
  fs.writeFileSync(out, buf);
  console.log(`生成した画像を ${out} に保存しました。`);
  return buf;
}

async function main() {
  // 1. 同名の既存リッチメニューを削除
  const listRes = await api("https://api.line.me/v2/bot/richmenu/list");
  const { richmenus } = (await listRes.json()) as {
    richmenus: { richMenuId: string; name: string }[];
  };
  for (const m of richmenus) {
    if (m.name === MENU_NAME) {
      await api(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, {
        method: "DELETE",
      });
      console.log(`既存メニューを削除: ${m.richMenuId}`);
    }
  }

  // 2. リッチメニューを作成
  const createRes = await api("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(richMenu),
  });
  const { richMenuId } = (await createRes.json()) as { richMenuId: string };
  console.log(`リッチメニューを作成: ${richMenuId}`);

  // 3. 画像をアップロード
  const image = await prepareImage();
  await api(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: new Uint8Array(image),
  });
  console.log("画像をアップロードしました。");

  // 4. 全ユーザーのデフォルトメニューに設定
  await api(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
  });
  console.log("デフォルトのリッチメニューに設定しました。完了 🎉");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
