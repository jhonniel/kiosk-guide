import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyKioskCorsHeaders, kioskCorsHeaders } from "@/lib/kiosk-api-cors";

const KIOSK_SYNC_PATHS = [
  "/api/kiosk/",
  "/api/cami/",
  "/api/search",
  "/api/downloads/",
  "/kiosk-offline-data.json",
  "/kiosk-citizens-charter.json",
];

function isKioskSyncPath(pathname: string): boolean {
  return KIOSK_SYNC_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

export function middleware(request: NextRequest) {
  if (!isKioskSyncPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: kioskCorsHeaders(request),
    });
  }

  const response = NextResponse.next();
  applyKioskCorsHeaders(request, response.headers);
  return response;
}

export const config = {
  matcher: [
    "/api/kiosk/:path*",
    "/api/cami/:path*",
    "/api/search",
    "/api/downloads/:path*",
    "/kiosk-offline-data.json",
    "/kiosk-citizens-charter.json",
  ],
};
