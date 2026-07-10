import { NextRequest, NextResponse } from "next/server";
import { createQrDownloadLink } from "@/features/downloads/download-service";
import { downloadQrRequestSchema } from "@/lib/validations";

function getRequestOrigin(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host");
  return host ? `${proto}://${host}` : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = downloadQrRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const link = await createQrDownloadLink(
      parsed.data.downloadId,
      getRequestOrigin(request)
    );

    return NextResponse.json({
      url: link.url,
      expiresAt: link.expiresAt.toISOString(),
      expiryMinutes: Math.round((link.expiresAt.getTime() - Date.now()) / 60000),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create QR link" },
      { status: 400 }
    );
  }
}
