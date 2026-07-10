import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getBoolSetting, getSetting } from "@/features/settings/resolve-settings";

export interface SpacesConfig {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  folder: string;
  publicCdnUrl: string;
  publicAcl: boolean;
}

function readEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.replace(/\/$/, "");
}

function resolveSpacesValue(
  settings: Record<string, string>,
  settingKey: string,
  envKeys: string[],
  fallback = ""
): string {
  for (const envKey of envKeys) {
    const fromEnv = readEnv(envKey);
    if (fromEnv) return fromEnv;
  }
  return getSetting(settings, settingKey, fallback);
}

export function getSpacesConfig(settings: Record<string, string>): SpacesConfig {
  const endpoint = normalizeEndpoint(
    resolveSpacesValue(settings, "spaces_endpoint", ["DIGITALOCEAN_SPACES_ENDPOINT"])
  );
  const region = resolveSpacesValue(settings, "spaces_region", ["DIGITALOCEAN_SPACES_REGION"], "sgp1");
  const bucket = resolveSpacesValue(settings, "spaces_bucket", ["DIGITALOCEAN_SPACES_BUCKET"]);
  const accessKeyId = resolveSpacesValue(settings, "spaces_access_key_id", ["DIGITALOCEAN_SPACES_KEY"]);
  const secretAccessKey = resolveSpacesValue(settings, "spaces_secret_key", [
    "DIGITALOCEAN_SPACES_SECRET",
  ]);
  const folder = resolveSpacesValue(
    settings,
    "spaces_folder",
    ["DIGITALOCEAN_SPACES_ROOT_PATH"],
    "kiosk-downloads"
  ).replace(/^\/+|\/+$/g, "");
  const publicCdnUrl = normalizeEndpoint(
    resolveSpacesValue(settings, "spaces_public_cdn_url", ["DIGITALOCEAN_SPACES_PATH"])
  );
  const hasCredentials = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
  const envConfigured = Boolean(
    readEnv("DIGITALOCEAN_SPACES_KEY") &&
      readEnv("DIGITALOCEAN_SPACES_SECRET") &&
      readEnv("DIGITALOCEAN_SPACES_ENDPOINT") &&
      readEnv("DIGITALOCEAN_SPACES_BUCKET")
  );
  const settingsEnabled = getBoolSetting(settings, "spaces_enabled");

  return {
    enabled: hasCredentials && (envConfigured || settingsEnabled),
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    folder,
    publicCdnUrl,
    publicAcl: getBoolSetting(settings, "spaces_public_acl"),
  };
}

export function isSpacesConfigured(settings: Record<string, string>) {
  const config = getSpacesConfig(settings);
  return (
    config.enabled &&
    Boolean(config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey)
  );
}

function createSpacesClient(config: SpacesConfig) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: false,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export function buildSpacesObjectKey(folder: string, fileName: string) {
  const stamp = Date.now();
  const safeName = sanitizeFileName(fileName);
  return folder ? `${folder}/${stamp}-${safeName}` : `${stamp}-${safeName}`;
}

export function buildSpacesPublicUrl(config: SpacesConfig, key: string) {
  if (config.publicCdnUrl) {
    return `${config.publicCdnUrl}/${key}`;
  }
  const endpointHost = config.endpoint.replace(/^https?:\/\//, "");
  return `https://${config.bucket}.${endpointHost}/${key}`;
}

export function isSpacesFileUrl(fileUrl: string, config: SpacesConfig) {
  if (!config.bucket) return false;
  if (config.publicCdnUrl && fileUrl.startsWith(config.publicCdnUrl)) return true;
  return fileUrl.includes(`${config.bucket}.`) && fileUrl.includes("digitaloceanspaces.com");
}

export function extractSpacesKeyFromUrl(fileUrl: string, config: SpacesConfig): string | null {
  if (config.publicCdnUrl && fileUrl.startsWith(`${config.publicCdnUrl}/`)) {
    return fileUrl.slice(config.publicCdnUrl.length + 1);
  }
  try {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

export async function uploadFileToSpaces(
  settings: Record<string, string>,
  file: { buffer: Buffer; fileName: string; contentType: string }
) {
  const config = getSpacesConfig(settings);
  if (!isSpacesConfigured(settings)) {
    throw new Error("DigitalOcean Spaces is not configured.");
  }

  const client = createSpacesClient(config);
  const key = buildSpacesObjectKey(config.folder, file.fileName);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.contentType,
      ACL: config.publicAcl ? "public-read" : "private",
    })
  );

  return {
    key,
    fileUrl: buildSpacesPublicUrl(config, key),
    fileName: file.fileName,
    fileSize: formatFileSize(file.buffer.length),
  };
}

export async function getFileFromSpaces(
  settings: Record<string, string>,
  fileUrl: string
): Promise<Buffer | null> {
  const config = getSpacesConfig(settings);
  if (!isSpacesConfigured(settings)) return null;

  const key = extractSpacesKeyFromUrl(fileUrl, config);
  if (!key) return null;

  const client = createSpacesClient(config);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );

  if (!response.Body) return null;
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteFileFromSpaces(settings: Record<string, string>, fileUrl: string) {
  const config = getSpacesConfig(settings);
  if (!isSpacesConfigured(settings)) return;

  const key = extractSpacesKeyFromUrl(fileUrl, config);
  if (!key) return;

  const client = createSpacesClient(config);
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
  ".txt",
]);
