import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineIdToken } from "@/lib/line-auth";
import { isFriendOfOfficialAccount } from "@/lib/friendship";

/**
 * ギフトカードを使用する。
 * updateMany の where 条件に status: "ACTIVE" を含めることで、
 * 同時リクエストが来ても 1 回しか使用できない（アトミックな更新）。
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await verifyLineIdToken(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  // 公式アカウントを友だち追加していないユーザーは使用不可
  let isFriend: boolean;
  try {
    isFriend = await isFriendOfOfficialAccount(user.userId);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "friendship_check_failed" },
      { status: 500 }
    );
  }
  if (!isFriend) {
    return NextResponse.json({ error: "not_friend" }, { status: 403 });
  }

  const result = await prisma.giftCard.updateMany({
    where: { token, status: "ACTIVE" },
    data: {
      status: "USED",
      usedById: user.userId,
      usedByName: user.displayName,
      usedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const card = await prisma.giftCard.findUnique({ where: { token } });
    if (!card) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "already_used", usedAt: card.usedAt },
      { status: 409 }
    );
  }

  const card = await prisma.giftCard.findUnique({ where: { token } });
  return NextResponse.json({ card });
}
