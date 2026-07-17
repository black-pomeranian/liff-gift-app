import { NextRequest } from "next/server";

export type LineUser = {
  userId: string;
  displayName: string;
  pictureUrl: string;
};

/**
 * Authorization: Bearer <IDトークン> を LINE の検証エンドポイントで検証し、
 * ユーザー情報を返す。検証に失敗した場合は null。
 * https://developers.line.biz/ja/reference/line-login/#verify-id-token
 */
export async function verifyLineIdToken(
  req: NextRequest
): Promise<LineUser | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const idToken = auth.slice("Bearer ".length);

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId) {
    console.error("LINE_LOGIN_CHANNEL_ID is not set");
    return null;
  }

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    sub?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub) return null;

  return {
    userId: data.sub,
    displayName: data.name ?? "",
    pictureUrl: data.picture ?? "",
  };
}
