import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineIdToken } from "@/lib/line-auth";
import { isFriendOfOfficialAccount } from "@/lib/friendship";

/** ギフトカードの内容を取得（受け取り側の表示用） */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await verifyLineIdToken(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  const card = await prisma.giftCard.findUnique({ where: { token } });
  if (!card) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 表示用に友だち状態も返す（判定できない場合は null = 不明。強制は使用 API 側で行う）
  let isFriend: boolean | null = null;
  try {
    isFriend = await isFriendOfOfficialAccount(user.userId);
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({
    card: {
      token: card.token,
      templateId: card.templateId,
      message: card.message,
      senderName: card.senderName,
      status: card.status,
      usedAt: card.usedAt,
      isFriend,
    },
  });
}
