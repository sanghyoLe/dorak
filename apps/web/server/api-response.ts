import "server-only";

export function apiError(error: unknown, context: string): Response {
  const requestId = crypto.randomUUID();
  const message = error instanceof Error ? error.message : "Unknown error";

  console.error("DORAK_API_ERROR", { context, message, requestId });

  return Response.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      meta: { requestId },
    },
    { status: 500 },
  );
}

export function apiNotFound(code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status: 404 });
}

export function apiBadRequest(code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status: 400 });
}

export function apiUnauthorized(code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status: 401 });
}

export function apiForbidden(code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status: 403 });
}

export function apiConflict(code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status: 409 });
}

export function apiUnprocessable(code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status: 422 });
}

export function apiTooManyRequests(code: string, message: string): Response {
  return Response.json(
    { error: { code, message } },
    { status: 429, headers: { "Retry-After": "86400" } },
  );
}
