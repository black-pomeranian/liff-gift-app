"use client";

import liff from "@line/liff";
import { giftUrl, giftImageUrl } from "./api-client";

export type ShareResult = "sent" | "cancelled" | "fallback-line";

/**
 * ギフトカードを LINE の友だちに送る。
 * 1. shareTargetPicker が使える場合: LINE 標準の送信先選択画面（トーク履歴・友だちから選択）を開く
 * 2. 使えない場合: LINE のシェア画面 (line.me/R/share) にフォールバック
 *
 * shareTargetPicker はコンソールの設定で有効化が必要:
 * ミニアプリチャネル > ウェブアプリ設定（LIFF タブ）> シェアターゲットピッカー を ON
 */
export async function shareGiftCard(card: {
  token: string;
  message: string;
  senderName: string;
}): Promise<ShareResult> {
  const url = giftUrl(card.token);
  const imageUrl = giftImageUrl(card.token);
  // hero image は https の絶対 URL が必須（NEXT_PUBLIC_APP_URL 未設定時は付けない）
  const hasThumbnail = imageUrl.startsWith("https://");

  if (liff.isApiAvailable("shareTargetPicker")) {
    const res = await liff.shareTargetPicker([
      {
        type: "flex",
        altText: `${card.senderName}さんからギフトカードが届きました🎁`,
        contents: {
          type: "bubble",
          ...(hasThumbnail
            ? {
                hero: {
                  type: "image" as const,
                  url: imageUrl,
                  size: "full" as const,
                  aspectRatio: "1.91:1" as const,
                  aspectMode: "cover" as const,
                },
              }
            : {}),
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "🎁 ギフトカードが届きました",
                weight: "bold",
                size: "md",
                wrap: true,
              },
              {
                type: "text",
                text: `${card.senderName}さんから`,
                size: "sm",
                color: "#6b7280",
              },
              { type: "text", text: card.message, size: "sm", wrap: true },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#06C755",
                action: { type: "uri", label: "カードを開く", uri: url },
              },
            ],
          },
        },
      },
    ]);
    // 送信完了なら結果オブジェクトが返り、キャンセル時は null/undefined
    return res ? "sent" : "cancelled";
  }

  // フォールバック: LINE のシェア画面（送信先のトーク選択）を開く
  const text = `🎁 ${card.senderName}さんからギフトカードが届きました\n${url}`;
  const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  if (liff.isInClient()) {
    liff.openWindow({ url: shareUrl, external: true });
  } else {
    window.open(shareUrl, "_blank");
  }
  return "fallback-line";
}
