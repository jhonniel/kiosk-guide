import { db } from "@/lib/db";
import { getNumberSetting, getResolvedSettings } from "@/features/settings/resolve-settings";
import { createSpacesSignedUrl } from "@/lib/storage/spaces";

export interface CharterPdfScanLink {
  /** Temporary Spaces link, or null when the PDF is not on Spaces (the kiosk link is used instead). */
  url: string | null;
  expiresAt: string | null;
}

/** Link for the Citizens' Charter QR code: straight from Spaces so any phone can open it. */
export async function getCharterPdfScanLink(): Promise<CharterPdfScanLink> {
  const edition = await db.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { pdfUrl: true },
  });
  if (!edition?.pdfUrl) return { url: null, expiresAt: null };

  const settings = await getResolvedSettings();
  const expiryMinutes = Math.max(5, getNumberSetting(settings, "download_qr_expiry_minutes", 60));
  const url = await createSpacesSignedUrl(settings, edition.pdfUrl, {
    expiresInSeconds: expiryMinutes * 60,
  });
  if (!url) return { url: null, expiresAt: null };

  return { url, expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString() };
}
