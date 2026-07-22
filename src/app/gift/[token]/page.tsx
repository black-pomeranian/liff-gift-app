import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GiftPageClient } from "./GiftPageClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const card = await prisma.giftCard.findUnique({ where: { token } });

  if (!card) {
    return { title: "ギフトカードが見つかりません" };
  }

  const title = `🎁 ${card.senderName}さんからギフトカードが届きました`;
  const description = card.message;
  const imageUrl = APP_URL ? `${APP_URL}/api/gift/${token}/image` : undefined;
  const pageUrl = APP_URL ? `${APP_URL}/gift/${token}` : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function GiftPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GiftPageClient token={token} />;
}
