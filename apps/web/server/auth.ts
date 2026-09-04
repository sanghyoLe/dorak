import "server-only";

import { betterAuth } from "better-auth";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const opsUsername = process.env.DORAK_OPS_USERNAME;
const opsPassword = process.env.DORAK_OPS_PASSWORD;
const productionDeployment = process.env.VERCEL_ENV === "production";
export const googleSignInEnabled = Boolean(
  googleClientId && googleClientSecret,
);

if (
  productionDeployment &&
  (!databaseUrl ||
    !authSecret ||
    !process.env.BETTER_AUTH_URL ||
    !opsUsername ||
    !opsPassword)
) {
  throw new Error(
    "Production requires database, auth, and ops credentials.",
  );
}

const globalAuth = globalThis as typeof globalThis & {
  dorakAuthPool?: Pool;
};

function getAuthPool(): Pool | undefined {
  if (!databaseUrl) return undefined;
  if (!globalAuth.dorakAuthPool) {
    globalAuth.dorakAuthPool = new Pool({
      connectionString: databaseUrl,
      max: process.env.VERCEL ? 1 : 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      options: "-c search_path=identity",
    });
  }
  return globalAuth.dorakAuthPool;
}

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const auth = betterAuth({
  appName: "도락",
  baseURL,
  ...(authSecret ? { secret: authSecret } : {}),
  ...(getAuthPool() ? { database: getAuthPool() } : {}),
  socialProviders: googleSignInEnabled
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          prompt: "select_account",
          requireEmailVerification: true,
        },
      }
    : {},
  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5, strategy: "jwt" },
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    modelName: "accounts",
    identityStrategy: "provider-id",
    encryptOAuthTokens: true,
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      idToken: "id_token",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  advanced: {
    cookiePrefix: "dorak",
    database: { generateId: "uuid", joins: true },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
  },
  telemetry: { enabled: false },
});
