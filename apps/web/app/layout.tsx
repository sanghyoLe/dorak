import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  display: "swap",
  variable: "--font-body-face",
  weight: "variable",
});

const displayFont = Noto_Serif_KR({
  display: "swap",
  variable: "--font-display-face",
  weight: "variable",
});

const appOrigin =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
const indexingEnabled = process.env.DORAK_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin),
  title: {
    default: "도락 — 좋은 식당을 찾는 즐거움",
    template: "%s — 도락",
  },
  description:
    "한국의 좋은 식당을 지점 단위로 찾고 기록하는 도락의 개발 프리뷰",
  applicationName: "도락",
  robots: indexingEnabled ? { index: true, follow: true } : { index: false },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "도락",
    title: "도락 — 좋은 식당을 찾는 즐거움",
    description: "한국의 좋은 식당을 지점 단위로 찾고 기록합니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <a className="skip-link" href="#main-content">
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
