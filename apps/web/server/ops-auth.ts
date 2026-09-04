import "server-only";

type OpsAuthorization =
  | { authorized: true }
  | { authorized: false; reason: "missing-config" | "invalid-credentials" };

function isProtectedDeployment(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function constantTimeEqual(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length);
  let difference = actual.length ^ expected.length;

  for (let index = 0; index < length; index += 1) {
    difference |=
      (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return difference === 0;
}

function decodeBasicCredentials(
  authorization: string | null,
): { username: string; password: string } | undefined {
  if (!authorization?.startsWith("Basic ")) return undefined;

  try {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString(
      "utf8",
    );
    const separator = decoded.indexOf(":");
    if (separator < 1) return undefined;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return undefined;
  }
}

export function authorizeOps(headers: Headers): OpsAuthorization {
  if (!isProtectedDeployment()) return { authorized: true };

  const expectedUsername = process.env.DORAK_OPS_USERNAME;
  const expectedPassword = process.env.DORAK_OPS_PASSWORD;
  if (!expectedUsername || !expectedPassword) {
    return { authorized: false, reason: "missing-config" };
  }

  const credentials = decodeBasicCredentials(headers.get("authorization"));
  if (
    !credentials ||
    !constantTimeEqual(credentials.username, expectedUsername) ||
    !constantTimeEqual(credentials.password, expectedPassword)
  ) {
    return { authorized: false, reason: "invalid-credentials" };
  }

  return { authorized: true };
}

export function opsAuthFailureResponse(
  authorization: Exclude<OpsAuthorization, { authorized: true }>,
  apiRequest: boolean,
): Response {
  const missingConfig = authorization.reason === "missing-config";
  const status = missingConfig ? 503 : 401;
  const message = missingConfig
    ? "운영자 인증 설정이 완료되지 않았습니다."
    : "운영자 인증이 필요합니다.";
  const headers = new Headers({ "Cache-Control": "no-store" });

  if (!missingConfig) {
    headers.set("WWW-Authenticate", 'Basic realm="Dorak Ops", charset="UTF-8"');
  }

  if (apiRequest) {
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(
      JSON.stringify({
        error: {
          code: missingConfig ? "OPS_AUTH_NOT_CONFIGURED" : "UNAUTHORIZED",
          message,
        },
      }),
      { headers, status },
    );
  }

  headers.set("Content-Type", "text/plain; charset=utf-8");
  return new Response(message, { headers, status });
}
