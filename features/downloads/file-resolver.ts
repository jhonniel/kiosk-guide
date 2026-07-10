import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import {
  getFileFromSpaces,
  getSpacesConfig,
  isSpacesConfigured,
  isSpacesFileUrl,
} from "@/lib/storage/spaces";

export interface ResolvedDownloadFile {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}

export function resolveLocalDownloadFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith("/")) return null;
  const relative = fileUrl.replace(/^\//, "");
  const absolute = path.join(process.cwd(), "public", relative);
  if (!absolute.startsWith(path.join(process.cwd(), "public"))) return null;
  if (!existsSync(absolute)) return null;
  return absolute;
}

function guessContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

async function fetchRemoteFile(fileUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function resolveDownloadFileContent(download: {
  fileUrl: string;
  fileName: string;
}): Promise<ResolvedDownloadFile | null> {
  const settings = await getResolvedSettings();
  const contentType = guessContentType(download.fileName);
  const spacesConfig = getSpacesConfig(settings);

  if (isSpacesConfigured(settings) && isSpacesFileUrl(download.fileUrl, spacesConfig)) {
    let buffer = await getFileFromSpaces(settings, download.fileUrl);
    if (!buffer) {
      buffer = await fetchRemoteFile(download.fileUrl);
    }
    if (!buffer) return null;
    return { buffer, fileName: download.fileName, contentType };
  }

  if (download.fileUrl.startsWith("http://") || download.fileUrl.startsWith("https://")) {
    const buffer = await fetchRemoteFile(download.fileUrl);
    if (!buffer) return null;
    return { buffer, fileName: download.fileName, contentType };
  }

  const filePath = resolveLocalDownloadFilePath(download.fileUrl);
  if (!filePath) return null;
  const buffer = await readFile(filePath);
  return { buffer, fileName: download.fileName, contentType };
}

export async function assertDownloadFileAvailable(download: {
  fileUrl: string;
  fileName: string;
}) {
  const file = await resolveDownloadFileContent(download);
  if (!file) {
    throw new Error("File is not available on this kiosk.");
  }
  return file;
}
