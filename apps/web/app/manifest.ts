import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "도락 — 좋은 식당을 찾는 즐거움",
    short_name: "도락",
    description: "한국의 좋은 식당을 지점 단위로 찾고 기록합니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe3",
    theme_color: "#8b2e1f",
    lang: "ko",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
