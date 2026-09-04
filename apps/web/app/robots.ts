import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const indexingEnabled = process.env.DORAK_ALLOW_INDEXING === "true";

  return {
    rules: indexingEnabled
      ? { userAgent: "*", allow: "/", disallow: ["/ops", "/api"] }
      : { userAgent: "*", disallow: "/" },
  };
}
