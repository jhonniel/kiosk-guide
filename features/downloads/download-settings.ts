import type { Language } from "@/lib/i18n/translations";
import {
  getBoolSetting,
  getLocalizedSetting,
  getNumberSetting,
  getSetting,
} from "@/features/settings/resolve-settings";

export interface DownloadDeliverySettings {
  qrEnabled: boolean;
  emailEnabled: boolean;
  qrExpiryMinutes: number;
  publicBaseUrl: string;
  modalTitle: string;
  modalHint: string;
  emailSubject: string;
  emailBody: string;
  smtpConfigured: boolean;
}

export function buildDownloadDeliverySettings(
  settings: Record<string, string>,
  lang: Language = "en"
): DownloadDeliverySettings {
  const smtpHost = getSetting(settings, "smtp_host");
  const smtpFrom = getSetting(settings, "smtp_from_email");

  return {
    qrEnabled: getBoolSetting(settings, "download_qr_enabled"),
    emailEnabled: getBoolSetting(settings, "download_email_enabled"),
    qrExpiryMinutes: Math.max(5, getNumberSetting(settings, "download_qr_expiry_minutes", 60)),
    publicBaseUrl: getSetting(settings, "download_public_base_url"),
    modalTitle: getLocalizedSetting(settings, "download_modal_title", lang),
    modalHint: getLocalizedSetting(settings, "download_modal_hint", lang),
    emailSubject: getLocalizedSetting(settings, "download_email_subject", lang),
    emailBody: getLocalizedSetting(settings, "download_email_body", lang),
    smtpConfigured: Boolean(smtpHost && smtpFrom),
  };
}

export function interpolateDownloadTemplate(
  template: string,
  vars: { title: string; fileName: string }
) {
  return template
    .replaceAll("{{title}}", vars.title)
    .replaceAll("{{fileName}}", vars.fileName);
}
