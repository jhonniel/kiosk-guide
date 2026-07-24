import {
  buildDownloadDeliverySettings,
  interpolateDownloadTemplate,
} from "@/features/downloads/download-settings";
import { assertDownloadFileAvailable } from "@/features/downloads/file-resolver";
import { getBoolSetting, getResolvedSettings } from "@/features/settings/resolve-settings";
import type { Language } from "@/lib/i18n/translations";
import { db } from "@/lib/db";

export async function sendCharterPdfByEmail(email: string, lang: Language = "en") {
  const settings = await getResolvedSettings();
  if (!getBoolSetting(settings, "download_email_enabled")) {
    throw new Error("Email delivery is disabled.");
  }

  const edition = await db.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      title: true,
      year: true,
      editionLabel: true,
      pdfUrl: true,
      pdfFileName: true,
    },
  });

  if (!edition?.pdfUrl) {
    throw new Error("Citizens' Charter PDF is not available.");
  }

  const fileName =
    edition.pdfFileName?.trim() || `Citizens-Charter-${edition.year}.pdf`;

  const file = await assertDownloadFileAvailable({
    fileUrl: edition.pdfUrl,
    fileName,
  });

  const delivery = buildDownloadDeliverySettings(settings, lang);
  if (!delivery.smtpConfigured) {
    throw new Error("SMTP is not configured. Please contact the administrator.");
  }

  const title =
    `${edition.title || "Citizens' Charter"} ${edition.year}` +
    (edition.editionLabel ? ` (${edition.editionLabel})` : "");

  const { sendDownloadEmail } = await import("@/features/downloads/email-service");

  await sendDownloadEmail({
    settings,
    to: email,
    subject: interpolateDownloadTemplate(delivery.emailSubject, {
      title,
      fileName,
    }),
    body: interpolateDownloadTemplate(delivery.emailBody, {
      title,
      fileName,
    }),
    attachmentBuffer: file.buffer,
    attachmentName: file.fileName,
    attachmentContentType: file.contentType,
  });

  return { success: true as const };
}
