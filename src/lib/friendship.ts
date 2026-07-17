/**
 * ユーザーが公式アカウント（Messaging API チャネル）を友だち追加しているかを判定する。
 *
 * Messaging API のプロフィール取得エンドポイントは、友だち追加していない
 * ユーザーに対して 404 を返すため、これを友だち判定に利用する。
 * https://developers.line.biz/ja/reference/messaging-api/#get-profile
 *
 * 前提: ミニアプリ（LINEログイン）チャネルと Messaging API チャネルが
 * 同じプロバイダー配下であること（userId が共通になるため）。
 */
export async function isFriendOfOfficialAccount(
  userId: string
): Promise<boolean> {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "LINE_MESSAGING_CHANNEL_ACCESS_TOKEN が未設定のため友だち判定ができません"
    );
  }

  const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.ok) return true;
  if (res.status === 404) return false;

  throw new Error(`友だち判定 API がエラーを返しました (${res.status})`);
}
