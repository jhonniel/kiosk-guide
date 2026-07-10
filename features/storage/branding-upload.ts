import { mkdir, writeFile } from "fs/promises";
import path from "path";

const BRANDING_DIR = path.join(process.cwd(), "public", "images", "branding");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);

export type BrandingImageKind = "logo" | "footer";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadBrandingImage(file: File, kind: BrandingImageKind) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 5 MB.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported image type. Use PNG, JPG, SVG, or WebP.");
  }

  if (file.type && !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported image type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(BRANDING_DIR, { recursive: true });

  const storedName = `${kind}-${Date.now()}${extension}`;
  const absolutePath = path.join(BRANDING_DIR, storedName);
  await writeFile(absolutePath, buffer);

  return {
    fileUrl: `/images/branding/${storedName}`,
  };
}
