import { mkdir, writeFile } from "fs/promises";
import path from "path";

const VIDEO_DIR = path.join(process.cwd(), "public", "videos", "promo");
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg", ".mov"]);
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadPromoVideo(file: File) {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video is too large. Maximum size is 80 MB.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported video type. Use MP4, WebM, OGG, or MOV.");
  }

  if (file.type && !ALLOWED_VIDEO_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported video type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(VIDEO_DIR, { recursive: true });

  const storedName = `promo-${Date.now()}-${sanitizeFileName(path.basename(file.name, extension))}${extension}`;
  const absolutePath = path.join(VIDEO_DIR, storedName);
  await writeFile(absolutePath, buffer);

  return {
    fileUrl: `/videos/promo/${storedName}`,
  };
}
