import { getBoolSetting, getNumberSetting, getSetting } from "@/features/settings/settings-helpers";

export const SMTP_SETTING_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_password",
  "smtp_from_email",
  "smtp_from_name",
] as const;

export type SmtpSettingKey = (typeof SMTP_SETTING_KEYS)[number];

/** Map .env vars → admin setting keys (env wins when set). */
export const SMTP_ENV_MAP: Record<SmtpSettingKey, string | undefined> = {
  smtp_host: process.env.SMTP_HOST,
  smtp_port: process.env.SMTP_PORT,
  smtp_secure: process.env.SMTP_SECURE,
  smtp_user: process.env.SMTP_USER,
  smtp_password: process.env.SMTP_PASSWORD,
  smtp_from_email: process.env.SMTP_FROM_EMAIL,
  smtp_from_name: process.env.SMTP_FROM_NAME,
};

export function applySmtpEnvOverrides(settings: Record<string, string>): Record<string, string> {
  const next = { ...settings };
  for (const key of SMTP_SETTING_KEYS) {
    const envValue = SMTP_ENV_MAP[key]?.trim();
    if (envValue) next[key] = envValue;
  }
  return next;
}

export interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  configured: boolean;
}

export function resolveSmtpConfig(settings: Record<string, string>): ResolvedSmtpConfig {
  const merged = applySmtpEnvOverrides(settings);
  const host = getSetting(merged, "smtp_host");
  const port = getNumberSetting(merged, "smtp_port", 587);
  const user = getSetting(merged, "smtp_user");
  const pass = getSetting(merged, "smtp_password");
  const fromEmail = getSetting(merged, "smtp_from_email");
  const fromName = getSetting(merged, "smtp_from_name", "LGU Camiguin Kiosk");
  const secure = getBoolSetting(merged, "smtp_secure");

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    configured: Boolean(host && fromEmail),
  };
}

export function formatSmtpFrom(config: ResolvedSmtpConfig) {
  return config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail;
}

const DEFAULT_INTERNAL_DOMAINS = ["camiguin.gov.ph"];

function emailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1).trim().toLowerCase() : "";
}

function internalMailDomains(): string[] {
  const raw = process.env.SMTP_INTERNAL_DOMAINS?.trim();
  if (!raw) return DEFAULT_INTERNAL_DOMAINS;
  return raw
    .split(/[,;\s]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function isInternalRecipient(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  return internalMailDomains().some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

function resolveRelaySmtpConfig(primary: ResolvedSmtpConfig): ResolvedSmtpConfig | null {
  const host = process.env.SMTP_RELAY_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_RELAY_PORT ?? "587");
  const secure = (process.env.SMTP_RELAY_SECURE ?? "false").toLowerCase() === "true";
  const user = process.env.SMTP_RELAY_USER?.trim() ?? "";
  const pass = process.env.SMTP_RELAY_PASSWORD?.trim() ?? "";
  const fromEmail = process.env.SMTP_RELAY_FROM_EMAIL?.trim() || primary.fromEmail;
  const fromName = process.env.SMTP_RELAY_FROM_NAME?.trim() || primary.fromName;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    configured: Boolean(host && fromEmail),
  };
}

/** Primary SMTP for internal mail; optional SMTP_RELAY_* for Gmail and other external domains. */
export function resolveSmtpConfigForRecipient(
  settings: Record<string, string>,
  recipientEmail: string
): ResolvedSmtpConfig {
  const primary = resolveSmtpConfig(settings);
  if (isInternalRecipient(recipientEmail)) {
    return primary;
  }

  const relay = resolveRelaySmtpConfig(primary);
  if (relay?.configured) {
    return relay;
  }

  return primary;
}

export function externalRelayConfigured(): boolean {
  const primary = resolveSmtpConfig({});
  return resolveRelaySmtpConfig(primary)?.configured ?? false;
}
