"use client";

import liff from "@line/liff";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type LiffContextValue = {
  ready: boolean;
  loggedIn: boolean;
  inClient: boolean;
  profile: LiffProfile | null;
  error: string | null;
  login: () => void;
  logout: () => void;
};

const LiffContext = createContext<LiffContextValue>({
  ready: false,
  loggedIn: false,
  inClient: false,
  profile: null,
  error: null,
  login: () => {},
  logout: () => {},
});

let initPromise: Promise<void> | null = null;

function initLiffOnce(liffId: string): Promise<void> {
  if (!initPromise) {
    initPromise = liff.init({ liffId });
  }
  return initPromise;
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [inClient, setInClient] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setError("NEXT_PUBLIC_LIFF_ID が設定されていません（.env を確認してください）");
      return;
    }
    let cancelled = false;
    initLiffOnce(liffId)
      .then(async () => {
        if (cancelled) return;
        setInClient(liff.isInClient());
        const isLoggedIn = liff.isLoggedIn();
        setLoggedIn(isLoggedIn);
        if (isLoggedIn) {
          const p = await liff.getProfile();
          if (cancelled) return;
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl,
          });
        }
        setReady(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "LIFF の初期化に失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.href });
    }
  }, []);

  const logout = useCallback(() => {
    if (liff.isLoggedIn()) {
      liff.logout();
      window.location.reload();
    }
  }, []);

  return (
    <LiffContext.Provider
      value={{ ready, loggedIn, inClient, profile, error, login, logout }}
    >
      {children}
    </LiffContext.Provider>
  );
}

export function useLiff() {
  return useContext(LiffContext);
}
