import nodemailer from "nodemailer";
import { getBoolSetting, getNumberSetting, getSetting } from "@/features/settings/resolve-settings";

interface SendDownloadEmailInput {
  settings: Record<string, string>;
  to: string;
  subject: string;
  body: string;
  attachmentBuffer: Buffer;
  attachmentName: string;
  attachmentContentType: string;
}

export async function sendDownloadEmail(input: SendDownloadEmailInput) {
  const host = getSetting(input.settings, "smtp_host");
  const port = getNumberSetting(input.settings, "smtp_port", 587);
  const user = getSetting(input.settings, "smtp_user");
  const pass = getSetting(input.settings, "smtp_password");
  const fromEmail = getSetting(input.settings, "smtp_from_email");
  const fromName = getSetting(input.settings, "smtp_from_name", "LGU Kiosk");
  const secure = getBoolSetting(input.settings, "smtp_secure");

  if (!host || !fromEmail) {
    throw new Error("SMTP host and from email are required.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
    to: input.to,
    subject: input.subject,
    text: input.body,
    attachments: [
      {
        filename: input.attachmentName,
        content: input.attachmentBuffer,
        contentType: input.attachmentContentType,
      },
    ],
  });
}
