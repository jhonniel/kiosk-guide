import type { NextRequest } from "next/server";

const DEFAULT_METHODS = "GET, POST, OPTIONS";
const DEFAULT_HEADERS = "Content-Type";

function parseAllowedOrigins(): string[] | null {
  const raw = process.env.KIOSK_CORS_ORIGINS?.trim();
  if (!raw) return null;
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = parseAllowedOrigins();
  if (!allowed) return true;
  if (allowed.includes("*")) return true;
  return allowed.some((entry) => origin === entry);
}

export function kioskCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": DEFAULT_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_HEADERS,
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  } else if (!parseAllowedOrigins()) {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

export function applyKioskCorsHeaders(
  request: NextRequest,
  headers: Headers
): void {
  for (const [key, value] of Object.entries(kioskCorsHeaders(request))) {
    headers.set(key, value);
  }
}
