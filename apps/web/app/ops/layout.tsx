import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./ops.css";

export const metadata: Metadata = {
  title: "도락 운영실",
  description: "도락 식당 후보 검수 도구",
};

export default function OpsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
