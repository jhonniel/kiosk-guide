import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  buildDownloadDeliverySettings,
  interpolateDownloadTemplate,
} from "@/features/downloads/download-settings";
import {
  assertDownloadFileAvailable,
  resolveDownloadFileContent,
} from "@/features/downloads/file-resolver";
import { getBoolSetting, getNumberSetting, getResolvedSettings, getSetting } from "@/features/settings/resolve-settings";
import { localized } from "@/lib/i18n/translations";
import type { Language } from "@/lib/i18n/translations";
import type { Download } from "@prisma/client";

function generateToken(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex").slice(0, 48);
}

export function resolvePublicBaseUrl(settings: Record<string, string>, requestOrigin?: string) {
  const configured = getSetting(settings, "download_public_base_url").trim();
  if (configured) return configured.replace(/\/$/, "");
  return requestOrigin?.replace(/\/$/, "") ?? "";
}

export async function createQrDownloadLink(
  downloadId: string,
  requestOrigin?: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const settings = await getResolvedSettings();
  if (!getBoolSetting(settings, "download_qr_enabled")) {
    throw new Error("QR downloads are disabled.");
  }

  const download = await db.download.findFirst({
    where: { id: downloadId, isActive: true },
  });
  if (!download) throw new Error("Download not found.");

  await assertDownloadFileAvailable(download);

  const expiryMinutes = Math.max(
    5,
    getNumberSetting(settings, "download_qr_expiry_minutes", 60)
  );
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const token = generateToken();
  const baseUrl = resolvePublicBaseUrl(settings, requestOrigin);
  if (!baseUrl) throw new Error("Public kiosk URL is not configured.");

  await db.$transaction(async (tx) => {
    const createdToken = await tx.downloadToken.create({
      data: {
        token,
        downloadId: download.id,
        method: "qr",
        expiresAt,
      },
    });

    await tx.downloadActivity.create({
      data: {
        downloadId: download.id,
        tokenId: createdToken.id,
        type: "QR_GENERATED",
      },
    });
  });

  return {
    token,
    url: `${baseUrl}/api/downloads/file/${token}`,
    expiresAt,
  };
}

export async function validateDownloadToken(token: string) {
  const record = await db.downloadToken.findUnique({
    where: { token },
    include: { download: true },
  });

  if (!record) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  if (!record.download.isActive) return null;

  const file = await resolveDownloadFileContent(record.download);
  if (!file) return null;

  await db.$transaction([
    db.downloadToken.update({
      where: { id: record.id },
      data: { accessCount: { increment: 1 } },
    }),
    db.download.update({
      where: { id: record.downloadId },
      data: { downloadCount: { increment: 1 } },
    }),
    db.downloadActivity.create({
      data: {
        downloadId: record.downloadId,
        tokenId: record.id,
        type: "QR_SCANNED",
      },
    }),
  ]);

  return file;
}

export async function sendDownloadByEmail(
  downloadId: string,
  email: string,
  lang: Language = "en"
) {
  const settings = await getResolvedSettings();
  if (!getBoolSetting(settings, "download_email_enabled")) {
    throw new Error("Email delivery is disabled.");
  }

  const download = await db.download.findFirst({
    where: { id: downloadId, isActive: true },
  });
  if (!download) throw new Error("Download not found.");

  const file = await assertDownloadFileAvailable(download);

  const delivery = buildDownloadDeliverySettings(settings, lang);
  if (!delivery.smtpConfigured) {
    throw new Error("SMTP is not configured. Please contact the administrator.");
  }

  const { sendDownloadEmail } = await import("@/features/downloads/email-service");
  const title = localized(download, lang, "title");

  await sendDownloadEmail({
    settings,
    to: email,
    subject: interpolateDownloadTemplate(delivery.emailSubject, {
      title,
      fileName: download.fileName,
    }),
    body: interpolateDownloadTemplate(delivery.emailBody, {
      title,
      fileName: download.fileName,
    }),
    attachmentBuffer: file.buffer,
    attachmentName: download.fileName,
    attachmentContentType: file.contentType,
  });

  const expiryMinutes = Math.max(
    5,
    getNumberSetting(settings, "download_qr_expiry_minutes", 60)
  );

  await db.$transaction(async (tx) => {
    const token = await tx.downloadToken.create({
      data: {
        token: generateToken(),
        downloadId: download.id,
        method: "email",
        recipientEmail: email,
        expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      },
    });

    await tx.download.update({
      where: { id: download.id },
      data: { downloadCount: { increment: 1 } },
    });

    await tx.downloadActivity.create({
      data: {
        downloadId: download.id,
        tokenId: token.id,
        type: "EMAIL_SENT",
        recipientEmail: email,
      },
    });
  });

  return { success: true as const };
}

export type { Download };
