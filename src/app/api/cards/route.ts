import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineIdToken } from "@/lib/line-auth";
import { getTemplate, MAX_MESSAGE_LENGTH } from "@/lib/templates";

/** カード作成 */
export async function POST(req: NextRequest) {
  const user = await verifyLineIdToken(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    templateId?: string;
    message?: string;
  } | null;

  const templateId = body?.templateId ?? "";
  const message = (body?.message ?? "").trim();

  if (!getTemplate(templateId)) {
    return NextResponse.json({ error: "invalid templateId" }, { status: 400 });
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `message は 1〜${MAX_MESSAGE_LENGTH} 文字で入力してください` },
      { status: 400 }
    );
  }

  const card = await prisma.giftCard.create({
    data: {
      senderId: user.userId,
      senderName: user.displayName,
      templateId,
      message,
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}

/** 自分が作成したカード一覧 */
export async function GET(req: NextRequest) {
  const user = await verifyLineIdToken(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cards = await prisma.giftCard.findMany({
    where: { senderId: user.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cards });
}
