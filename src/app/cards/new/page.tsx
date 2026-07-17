"use client";

import liff from "@line/liff";
import Link from "next/link";
import { useState } from "react";
import { useLiff } from "@/components/LiffProvider";
import { GiftCardView } from "@/components/GiftCardView";
import { apiFetch, giftUrl } from "@/lib/api-client";
import { CARD_TEMPLATES, MAX_MESSAGE_LENGTH } from "@/lib/templates";

type CreatedCard = { token: string; templateId: string; message: string };

export default function NewCardPage() {
  const { ready, loggedIn, profile, error, login } = useLiff();
  const [templateId, setTemplateId] = useState(CARD_TEMPLATES[0].id);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCard | null>(null);
  const [copied, setCopied] = useState(false);

  if (error) {
    return (
      <main className="container">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="container">
        <div className="loading">読み込み中…</div>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="container">
        <p className="result-message">ログインが必要です。</p>
        <button className="btn btn-primary" onClick={login}>
          LINE でログイン
        </button>
      </main>
    );
  }

  const handleCreate = async () => {
    setSubmitting(true);
    setApiError(null);
    try {
      const res = await apiFetch("/api/cards", {
        method: "POST",
        body: JSON.stringify({ templateId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "カードの作成に失敗しました");
      }
      setCreated(data.card);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "カードの作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async (card: CreatedCard) => {
    const url = giftUrl(card.token);
    if (liff.isApiAvailable("shareTargetPicker")) {
      await liff.shareTargetPicker([
        {
          type: "flex",
          altText: `${profile?.displayName ?? ""}さんからギフトカードが届きました🎁`,
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                { type: "text", text: "🎁 ギフトカードが届きました", weight: "bold", size: "md", wrap: true },
                { type: "text", text: `${profile?.displayName ?? ""}さんから`, size: "sm", color: "#6b7280" },
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
    } else {
      await copyUrl(card);
    }
  };

  const copyUrl = async (card: CreatedCard) => {
    await navigator.clipboard.writeText(giftUrl(card.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    return (
      <main className="container">
        <h1 className="page-title">カードを作成しました 🎉</h1>
        <GiftCardView
          templateId={created.templateId}
          message={created.message}
          senderName={profile?.displayName}
        />
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => handleShare(created)}>
            LINE の友だちに送る
          </button>
          <button className="btn btn-secondary" onClick={() => copyUrl(created)}>
            {copied ? "コピーしました ✓" : "リンクをコピー"}
          </button>
          <Link href="/cards" className="btn btn-secondary">
            送ったカード一覧へ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="page-title">ギフトカードを作る</h1>

      <div className="section-label">プレビュー</div>
      <GiftCardView
        templateId={templateId}
        message={message || "メッセージがここに表示されます"}
        senderName={profile?.displayName}
      />

      <div className="section-label">デザインを選ぶ</div>
      <div className="template-grid">
        {CARD_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`template-item${t.id === templateId ? " selected" : ""}`}
            onClick={() => setTemplateId(t.id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.image} alt={t.name} />
            <span className="template-name">{t.name}</span>
          </button>
        ))}
      </div>

      <div className="section-label">メッセージ</div>
      <textarea
        className="textarea"
        value={message}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="例：いつもありがとう！コーヒーおごります☕"
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="char-count">
        {message.length} / {MAX_MESSAGE_LENGTH}
      </div>

      {apiError ? <div className="error-box">{apiError}</div> : null}

      <div className="btn-row">
        <button
          className="btn btn-primary"
          disabled={!message.trim() || submitting}
          onClick={handleCreate}
        >
          {submitting ? "作成中…" : "カードを作成する"}
        </button>
        <Link href="/" className="btn btn-secondary">
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}
