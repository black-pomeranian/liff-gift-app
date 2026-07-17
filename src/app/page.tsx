"use client";

import Link from "next/link";
import { useLiff } from "@/components/LiffProvider";

export default function HomePage() {
  const { ready, loggedIn, profile, error, login, logout } = useLiff();

  if (error) {
    return (
      <main className="container">
        <h1 className="page-title">LIFF ギフトカード</h1>
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

  return (
    <main className="container">
      <h1 className="page-title">🎁 LIFF ギフトカード</h1>

      {loggedIn && profile ? (
        <>
          <div className="profile-row">
            {profile.pictureUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={profile.pictureUrl} alt="" />
            ) : null}
            <div>
              <div className="profile-name">{profile.displayName}</div>
              <div style={{ fontSize: 12, color: "var(--text-sub)" }}>
                ログイン中
              </div>
            </div>
          </div>

          <div className="btn-row">
            <Link href="/cards/new" className="btn btn-primary">
              ギフトカードを作る
            </Link>
            <Link href="/cards" className="btn btn-secondary">
              送ったカードを見る
            </Link>
            <button className="btn btn-secondary" onClick={logout}>
              ログアウト
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="result-message">
            LINE アカウントでログインして、
            <br />
            オリジナルのギフトカードを送りましょう。
          </p>
          <button className="btn btn-primary" onClick={login}>
            LINE でログイン
          </button>
        </>
      )}
    </main>
  );
}
