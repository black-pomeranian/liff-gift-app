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
