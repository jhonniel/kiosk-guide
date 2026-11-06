import { NextResponse } from "next/server";
import { getCharterPdfScanLink } from "@/features/citizens-charter/charter-pdf-link";

export const dynamic = "force-dynamic";

/** Temporary link for the Citizens' Charter QR code. */
export async function GET() {
  try {
    const link = await getCharterPdfScanLink();
    return NextResponse.json(link, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[citizens-charter/scan-link]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "The charter link is unavailable right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
