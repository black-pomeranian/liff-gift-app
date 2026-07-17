"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiff } from "@/components/LiffProvider";
import { GiftCardView } from "@/components/GiftCardView";
import { apiFetch } from "@/lib/api-client";

type Card = {
  token: string;
  templateId: string;
  message: string;
  senderName: string;
  status: "ACTIVE" | "USED";
  usedAt: string | null;
};

export default function GiftPage() {
  const { token } = useParams<{ token: string }>();
  const { ready, loggedIn, error, login } = useLiff();
  const [card, setCard] = useState<Card | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [using, setUsing] = useState(false);
  const [justUsed, setJustUsed] = useState(false);

  useEffect(() => {
    if (!ready || !loggedIn || !token) return;
    apiFetch(`/api/gift/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 404) throw new Error("このカードは存在しません。");
        if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
        setCard(data.card);
      })
      .catch((e: unknown) => {
        setApiError(e instanceof Error ? e.message : "取得に失敗しました");
      });
  }, [ready, loggedIn, token]);

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
        <p className="result-message">
          ギフトカードを受け取るには
          <br />
          LINE ログインが必要です。
        </p>
        <button className="btn btn-primary" onClick={login}>
          LINE でログイン
        </button>
      </main>
    );
  }

  const handleUse = async () => {
    if (!card) return;
    if (!window.confirm("このカードを使用しますか？使用すると元に戻せません。")) {
      return;
    }
    setUsing(true);
    setApiError(null);
    try {
      const res = await apiFetch(`/api/gift/${card.token}/use`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 409) {
        setCard({ ...card, status: "USED", usedAt: data.usedAt ?? null });
        setApiError("このカードはすでに使用されています。");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "使用処理に失敗しました");
      setCard(data.card);
      setJustUsed(true);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "使用処理に失敗しました");
    } finally {
      setUsing(false);
    }
  };

  return (
    <main className="container">
      <h1 className="page-title">🎁 ギフトカード</h1>

      {apiError ? <div className="error-box">{apiError}</div> : null}

      {!card && !apiError ? <div className="loading">読み込み中…</div> : null}

      {card ? (
        <>
          <p className="result-message">
            {card.senderName} さんからのギフトカードです
          </p>
          <GiftCardView
            templateId={card.templateId}
            message={card.message}
            senderName={card.senderName}
            used={card.status === "USED"}
          />

          {justUsed ? (
            <p className="result-message">
              ✅ カードを使用しました！
              <br />
              この画面をお店の人に見せるなどしてご利用ください。
            </p>
          ) : null}

          {card.status === "USED" && !justUsed ? (
            <p className="result-message">
              このカードは使用済みです
              {card.usedAt
                ? `（${new Date(card.usedAt).toLocaleString("ja-JP")}）`
                : ""}
              。
            </p>
          ) : null}

          <div className="btn-row">
            {card.status === "ACTIVE" ? (
              <button
                className="btn btn-primary"
                disabled={using}
                onClick={handleUse}
              >
                {using ? "処理中…" : "このカードを使用する"}
              </button>
            ) : null}
            <Link href="/" className="btn btn-secondary">
              ホームへ
            </Link>
          </div>
        </>
      ) : null}
    </main>
  );
}
