import { NextRequest, NextResponse } from "next/server";
import { buildDownloadDeliverySettings } from "@/features/downloads/download-settings";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import type { Language } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

/** Live download/email flags for the kiosk (bypasses stale offline cache). */
export async function GET(request: NextRequest) {
  const lang = (request.nextUrl.searchParams.get("lang") ?? "en") as Language;
  const settings = await getResolvedSettings();
  const delivery = buildDownloadDeliverySettings(settings, lang);

  return NextResponse.json(delivery, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
