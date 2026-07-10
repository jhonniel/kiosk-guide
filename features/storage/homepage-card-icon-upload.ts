import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ICON_DIR = path.join(process.cwd(), "public", "images", "homepage-cards");
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

export async function uploadHomepageCardIcon(file: File, slug?: string) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 2 MB.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported image type. Use PNG, JPG, SVG, or WebP.");
  }

  if (file.type && !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported image type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(ICON_DIR, { recursive: true });

  const safeSlug = slug?.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-") || "card";
  const storedName = `${safeSlug}-${Date.now()}${extension}`;
  const absolutePath = path.join(ICON_DIR, storedName);
  await writeFile(absolutePath, buffer);

  return {
    fileUrl: `/images/homepage-cards/${storedName}`,
  };
}
