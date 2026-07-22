"use client";

import liff from "@line/liff";

/**
 * LIFF の ID トークンを Authorization ヘッダーに付けて API を呼び出す。
 * サーバー側は verifyLineIdToken でこのトークンを検証する。
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const idToken = liff.getIDToken();
  if (!idToken) {
    throw new Error(
      "ID トークンが取得できません。LIFF アプリのスコープに openid が含まれているか確認してください。"
    );
  }
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });
}

/** ギフトカードの共有用 URL（ミニアプリのパーマネントリンク。LINE 内で開くとログイン済みで遷移できる） */
export function giftUrl(token: string): string {
  return `https://miniapp.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/gift/${token}`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

/**
 * OGP プレビュー・シェア時のサムネイルに使う画像 URL（自サーバーの動的生成 API）。
 * NEXT_PUBLIC_APP_URL（自分の公開 URL）が未設定の場合は相対パスを返す。
 */
export function giftImageUrl(token: string): string {
  return APP_URL
    ? `${APP_URL}/api/gift/${token}/image`
    : `/api/gift/${token}/image`;
}
