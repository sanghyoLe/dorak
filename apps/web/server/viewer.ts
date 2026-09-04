import "server-only";

import { SYNTHETIC_DEMO_USER } from "@dorak/server-catalog";
import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "./auth";

export interface Viewer {
  userId: string;
  name: string;
  identityVerified: boolean;
  demo: boolean;
}

function demoViewerEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DORAK_DEMO_AUTH === "true"
  );
}

export async function resolveViewer(
  requestHeaders: Headers,
): Promise<Viewer | null> {
  try {
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (session) {
      return {
        userId: session.user.id,
        name: session.user.name,
        identityVerified: session.user.emailVerified,
        demo: false,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DORAK_AUTH_SESSION_ERROR", { message });
  }

  if (!demoViewerEnabled()) return null;
  return {
    userId: SYNTHETIC_DEMO_USER.id,
    name: SYNTHETIC_DEMO_USER.name,
    identityVerified: false,
    demo: true,
  };
}

export const getViewer = cache(async () => resolveViewer(await headers()));
