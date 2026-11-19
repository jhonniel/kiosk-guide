import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PLAN_DIR = path.join(process.cwd(), "public", "images", "indoor-plans");
const MAX_BYTES = 25 * 1024 * 1024;

// PDFs are refused: neither the editor overlay nor the kiosk 3D directory can render them.
const EXT = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

export type FloorPlanUploadResult = {
  fileUrl: string;
  mimeType: string;
  originalName: string;
  widthPx: number;
  heightPx: number;
};

async function probeImageSize(buffer: Buffer): Promise<{ width: number; height: number }> {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let i = 2;
    while (i < buffer.length - 8) {
      if (buffer[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buffer[i + 1]!;
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(i + 5),
          width: buffer.readUInt16BE(i + 7),
        };
      }
      const len = buffer.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  return { width: 1000, height: 700 };
}

export async function uploadIndoorFloorPlan(file: File): Promise<FloorPlanUploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error("File is too large. Maximum size is 25 MB.");
  }
  const extension = path.extname(file.name).toLowerCase();
  if (!EXT.has(extension)) {
    throw new Error("Unsupported file type. Use PNG, JPG, SVG or WebP. Save PDF pages as images first.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(PLAN_DIR, { recursive: true });

  const { width: widthPx, height: heightPx } = await probeImageSize(buffer);
  let mimeType: string;
  if (extension === ".svg") mimeType = "image/svg+xml";
  else if (extension === ".png") mimeType = "image/png";
  else if (extension === ".webp") mimeType = "image/webp";
  else mimeType = "image/jpeg";

  const storedName = `floor-${Date.now()}${extension}`;
  await writeFile(path.join(PLAN_DIR, storedName), buffer);

  return {
    fileUrl: `/images/indoor-plans/${storedName}`,
    mimeType,
    originalName: file.name,
    widthPx,
    heightPx,
  };
}
