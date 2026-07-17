"use client";

import { getTemplate } from "@/lib/templates";

type Props = {
  templateId: string;
  message: string;
  senderName?: string;
  used?: boolean;
};

export function GiftCardView({ templateId, message, senderName, used }: Props) {
  const template = getTemplate(templateId);
  return (
    <div
      className={`gift-card${used ? " is-used" : ""}`}
      style={{ backgroundImage: template ? `url(${template.image})` : undefined }}
    >
      <div className="card-message">{message}</div>
      {senderName ? <div className="card-sender">From: {senderName}</div> : null}
    </div>
  );
}
