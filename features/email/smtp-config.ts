import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { ResolvedSmtpConfig } from "@/features/email/smtp-env";

export {
  SMTP_SETTING_KEYS,
  SMTP_ENV_MAP,
  applySmtpEnvOverrides,
  resolveSmtpConfig,
  resolveSmtpConfigForRecipient,
  isInternalRecipient,
  externalRelayConfigured,
  formatSmtpFrom,
  type SmtpSettingKey,
  type ResolvedSmtpConfig,
} from "@/features/email/smtp-env";

export function createSmtpTransporter(config: ResolvedSmtpConfig) {
  if (!config.host || !config.fromEmail) {
    throw new Error("SMTP host and from email are required.");
  }

  const transport: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  };

  // Port 587 typically uses STARTTLS (secure=false, requireTLS=true).
  if (!config.secure && config.port === 587) {
    transport.requireTLS = true;
  }

  return nodemailer.createTransport(transport);
}
