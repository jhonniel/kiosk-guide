import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PLAN_DIR = path.join(process.cwd(), "public", "images", "indoor-plans");
const MAX_BYTES = 25 * 1024 * 1024;

const EXT = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp", ".pdf"]);

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
    throw new Error("Unsupported type. Use PNG, JPG, SVG, WebP, or PDF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await mkdir(PLAN_DIR, { recursive: true });

  let mimeType = file.type || "application/octet-stream";
  let widthPx = 1000;
  let heightPx = 700;

  if (extension === ".pdf") {
    mimeType = "application/pdf";
    // PDF overlay is not supported in Leaflet ImageOverlay — store file and use placeholder size.
    // Admin UI prompts converting to PNG for digitizing.
    widthPx = 1000;
    heightPx = 1400;
  } else {
    const size = await probeImageSize(buffer);
    widthPx = size.width;
    heightPx = size.height;
    if (extension === ".svg") mimeType = "image/svg+xml";
    else if (extension === ".png") mimeType = "image/png";
    else if (extension === ".webp") mimeType = "image/webp";
    else mimeType = "image/jpeg";
  }

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
