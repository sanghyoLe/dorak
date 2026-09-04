import "server-only";

import { InMemoryCatalog, PostgresCatalog } from "@dorak/server-catalog";
import { cache } from "react";

type Catalog = InMemoryCatalog | PostgresCatalog;

const globalCatalog = globalThis as typeof globalThis & {
  dorakCatalog?: Catalog;
};

function createCatalog(): Catalog {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (process.env.VERCEL) {
      throw new Error("DATABASE_URL is required in Vercel environments.");
    }

    return new InMemoryCatalog();
  }

  const configuredMaximum = Number(process.env.DATABASE_POOL_MAX);
  const maxConnections = Number.isInteger(configuredMaximum)
    ? Math.min(Math.max(configuredMaximum, 1), 10)
    : process.env.VERCEL
      ? 1
      : 5;

  return new PostgresCatalog(databaseUrl, { maxConnections });
}

export function getCatalog(): Catalog {
  if (!globalCatalog.dorakCatalog) {
    globalCatalog.dorakCatalog = createCatalog();
  }

  return globalCatalog.dorakCatalog;
}

export const findBranch = cache(async (publicId: string) => {
  return await getCatalog().findBranch(publicId);
});

export const listBranchReviews = cache(async (publicId: string) => {
  return await getCatalog().listReviews(publicId);
});
