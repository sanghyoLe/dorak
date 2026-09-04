import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
