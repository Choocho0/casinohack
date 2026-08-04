import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppFrame from "@/components/AppFrame";
import { getDataBaseDate } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nowcast — 카지노 혼잡 예보",
  description:
    "초보자도 딸깍 한 번으로 확인하는 강원랜드 카지노 혼잡 예보 · AI 가이드",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14161C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-bg-base font-sans text-text-main antialiased">
        <AppFrame dataDate={getDataBaseDate()}>{children}</AppFrame>
      </body>
    </html>
  );
}
