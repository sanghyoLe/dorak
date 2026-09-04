import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authorizeOps, opsAuthFailureResponse } from "./server/ops-auth";

export function proxy(request: NextRequest) {
  const authorization = authorizeOps(request.headers);
  if (authorization.authorized) return NextResponse.next();

  return opsAuthFailureResponse(
    authorization,
    request.nextUrl.pathname.startsWith("/api/"),
  );
}

export const config = {
  matcher: ["/ops/:path*", "/api/v1/ops/:path*"],
};
