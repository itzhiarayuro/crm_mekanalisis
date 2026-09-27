import type { NextRequest } from "next/server";

export function requestContext(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || request.headers.get("x-real-ip") || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error inesperado";
  const status = message === "UNAUTHORIZED" ? 401 : 400;
  return Response.json({ error: message === "UNAUTHORIZED" ? "No autorizado" : message }, { status });
}
