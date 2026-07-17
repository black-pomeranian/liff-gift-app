import type { Metadata, Viewport } from "next";
import { LiffProvider } from "@/components/LiffProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIFF ギフトカード",
  description: "LINE 上でカスタムギフトカードを作成・送信できるアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  );
}
