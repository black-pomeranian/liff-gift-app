"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiff } from "@/components/LiffProvider";
import { apiFetch, giftUrl } from "@/lib/api-client";
import { shareGiftCard } from "@/lib/share";
import { getTemplate } from "@/lib/templates";

type Card = {
  id: string;
  token: string;
  templateId: string;
  message: string;
  senderName: string;
  status: "ACTIVE" | "USED";
  usedByName: string | null;
  usedAt: string | null;
  createdAt: string;
};

export default function CardsPage() {
  const { ready, loggedIn, error, login } = useLiff();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !loggedIn) return;
    apiFetch("/api/cards")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "取得に失敗しました");
        setCards(data.cards);
      })
      .catch((e: unknown) => {
        setApiError(e instanceof Error ? e.message : "取得に失敗しました");
      });
  }, [ready, loggedIn]);

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

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(giftUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const share = async (card: Card) => {
    setApiError(null);
    try {
      await shareGiftCard({
        token: card.token,
        message: card.message,
        senderName: card.senderName,
      });
    } catch {
      setApiError(
        "送信画面を開けませんでした。コンソールの「ウェブアプリ設定」でシェアターゲットピッカーが有効か確認してください。"
      );
    }
  };

  return (
    <main className="container">
      <h1 className="page-title">送ったカード</h1>

      {apiError ? <div className="error-box">{apiError}</div> : null}

      {cards === null && !apiError ? (
        <div className="loading">読み込み中…</div>
      ) : null}

      {cards !== null && cards.length === 0 ? (
        <p className="result-message">まだカードがありません。</p>
      ) : null}

      {cards !== null && cards.length > 0 ? (
        <div className="card-list">
          {cards.map((card) => {
            const template = getTemplate(card.templateId);
            return (
              <div key={card.id} className="card-list-item">
                {template ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={template.image} alt="" />
                ) : null}
                <div className="card-list-body">
                  <div className="card-list-message">{card.message}</div>
                  <div className="card-list-date">
                    {new Date(card.createdAt).toLocaleString("ja-JP")}
                  </div>
                  {card.status === "USED" ? (
                    <span className="badge badge-used">
                      使用済み{card.usedByName ? `（${card.usedByName}）` : ""}
                    </span>
                  ) : (
                    <>
                      <span className="badge badge-active">未使用</span>{" "}
                      <button
                        className="badge badge-active"
                        style={{ border: "none", cursor: "pointer" }}
                        onClick={() => share(card)}
                      >
                        LINE で送る
                      </button>{" "}
                      <button
                        className="badge badge-active"
                        style={{ border: "none", cursor: "pointer" }}
                        onClick={() => copy(card.token)}
                      >
                        {copiedToken === card.token ? "コピーしました ✓" : "リンクをコピー"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="btn-row">
        <Link href="/cards/new" className="btn btn-primary">
          新しいカードを作る
        </Link>
        <Link href="/" className="btn btn-secondary">
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}
