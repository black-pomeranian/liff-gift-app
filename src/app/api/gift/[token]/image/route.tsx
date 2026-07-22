import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { loadJapaneseFont } from "@/lib/og-font";

// Prisma(SQLite) を使うため Node.js ランタイムが必須
export const runtime = "nodejs";

const GRADIENTS: Record<string, [string, string]> = {
  thanks: ["#ff8a80", "#ff5e8a"],
  birthday: ["#7c4dff", "#448aff"],
  congrats: ["#f7b733", "#fc4a1a"],
  coffee: ["#6d4c41", "#3e2723"],
};

/**
 * カードのデザイン + メッセージを合成した PNG を返す。
 * OGP プレビュー(generateMetadata)と、shareTargetPicker の Flex メッセージの
 * サムネイル(hero image)の両方から参照される、認証不要の公開エンドポイント。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const card = await prisma.giftCard.findUnique({ where: { token } });
  if (!card) {
    return new Response("Not Found", { status: 404 });
  }

  const [from, to] = GRADIENTS[card.templateId] ?? GRADIENTS.thanks;
  const fontSize =
    card.message.length > 60 ? 34 : card.message.length > 30 ? 44 : 60;

  let fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] =
    [];
  try {
    const data = await loadJapaneseFont(
      `${card.message}From:${card.senderName}使用済み`
    );
    fonts = [{ name: "Noto Sans JP", data, weight: 700, style: "normal" }];
  } catch (e) {
    console.error("OG 画像用フォントの取得に失敗しました", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          padding: 72,
          position: "relative",
          fontFamily: fonts.length ? "Noto Sans JP" : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            textShadow: "0 2px 14px rgba(0,0,0,0.35)",
            maxWidth: 1000,
            lineHeight: 1.4,
          }}
        >
          {card.message}
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 48,
            right: 64,
            fontSize: 30,
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 1px 8px rgba(0,0,0,0.35)",
          }}
        >
          From: {card.senderName}
        </div>
        {card.status === "USED" ? (
          <div
            style={{
              display: "flex",
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 8,
              }}
            >
              使用済み
            </div>
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
