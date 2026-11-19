import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { AdminPermissionName } from "@/features/admin/permissions";
import type { ImageFolder } from "@/features/admin/resource-definitions";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

/** Picture folders under `public/images` and the permission needed to add to each. */
export const KIOSK_IMAGE_FOLDERS: Partial<Record<ImageFolder, AdminPermissionName>> = {
  news: "manage_announcements",
  tourism: "manage_tourism",
};

/** Saves a picture for kiosk content (announcements, tourism) next to the ones shipped with the kiosk. */
export async function uploadKioskImage(file: File, folder: ImageFolder) {
  if (!(folder in KIOSK_IMAGE_FOLDERS)) {
    throw new Error("Pictures cannot be uploaded here.");
  }
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

  const directory = path.join(process.cwd(), "public", "images", folder);
  await mkdir(directory, { recursive: true });

  const baseName =
    path
      .basename(file.name, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
  const storedName = `${baseName}-${Date.now()}${extension}`;
  await writeFile(path.join(directory, storedName), Buffer.from(await file.arrayBuffer()));

  return { fileUrl: `/images/${folder}/${storedName}` };
}
