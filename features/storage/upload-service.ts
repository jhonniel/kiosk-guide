import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  formatFileSize,
  isSpacesConfigured,
  uploadFileToSpaces,
} from "@/lib/storage/spaces";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadDownloadFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum size is 25 MB.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported file type.");
  }

  if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported file type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = sanitizeFileName(file.name);
  const contentType = file.type || "application/octet-stream";
  const settings = await getResolvedSettings();

  if (isSpacesConfigured(settings)) {
    return uploadFileToSpaces(settings, { buffer, fileName, contentType });
  }

  const uploadsDir = path.join(process.cwd(), "public", "downloads");
  await mkdir(uploadsDir, { recursive: true });
  const storedName = `${Date.now()}-${fileName}`;
  const absolutePath = path.join(uploadsDir, storedName);
  await writeFile(absolutePath, buffer);

  return {
    key: storedName,
    fileUrl: `/downloads/${storedName}`,
    fileName,
    fileSize: formatFileSize(buffer.length),
  };
}
