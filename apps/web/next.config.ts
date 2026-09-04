import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net http://*.daumcdn.net",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https: http://*.daumcdn.net",
  "object-src 'none'",
  [
    "script-src 'self' 'unsafe-inline'",
    // React's development error overlay reconstructs call stacks with eval().
    // Keep this development-only so production deployments remain stricter.
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
    "https://dapi.kakao.com",
    "https://t1.daumcdn.net",
    "http://t1.daumcdn.net",
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@dorak/domain-types", "@dorak/server-catalog"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.VERCEL_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
