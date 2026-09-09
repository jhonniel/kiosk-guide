import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

const CAPTURE_DIR = path.join(process.cwd(), "data", "kiosk-captures");
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function resolveCaptureAbsolutePath(imagePath: string) {
  const normalized = imagePath.replace(/\\/g, "/");
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid capture path.");
  }
  const absolute = path.join(CAPTURE_DIR, normalized);
  if (!absolute.startsWith(CAPTURE_DIR)) {
    throw new Error("Invalid capture path.");
  }
  return absolute;
}

export async function saveKioskSessionCapture(input: {
  sessionId: string;
  page: string;
  language?: string;
  imageBuffer: Buffer;
  contentType: string;
}) {
  if (input.imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Capture image is too large.");
  }

  const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
  if (!allowed.has(input.contentType.toLowerCase())) {
    throw new Error("Unsupported capture image type.");
  }

  const ext =
    input.contentType.includes("png")
      ? ".png"
      : input.contentType.includes("webp")
        ? ".webp"
        : ".jpg";

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fileName = `${Date.now()}-${input.sessionId.slice(0, 8)}${ext}`;
  const relativePath = path.join(folder, fileName).replace(/\\/g, "/");

  const absoluteDir = path.join(CAPTURE_DIR, folder);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(CAPTURE_DIR, relativePath), input.imageBuffer);

  return db.kioskSessionCapture.create({
    data: {
      sessionId: input.sessionId,
      page: input.page,
      language: input.language,
      imagePath: relativePath,
    },
  });
}

export async function getRecentKioskCaptures(limit = 50) {
  return db.kioskSessionCapture.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getLatestKioskCapture() {
  return db.kioskSessionCapture.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

export async function getKioskCaptureById(id: string) {
  return db.kioskSessionCapture.findUnique({ where: { id } });
}

export async function getSessionCaptureSummary(limit = 20) {
  const rows = await db.kioskSessionCapture.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const bySession = new Map<
    string,
    {
      sessionId: string;
      lastPage: string;
      language: string | null;
      lastSeenAt: Date;
      captureCount: number;
      latestCaptureId: string;
    }
  >();

  for (const row of rows) {
    const existing = bySession.get(row.sessionId);
    if (existing) {
      existing.captureCount += 1;
      continue;
    }
    bySession.set(row.sessionId, {
      sessionId: row.sessionId,
      lastPage: row.page,
      language: row.language,
      lastSeenAt: row.createdAt,
      captureCount: 1,
      latestCaptureId: row.id,
    });
  }

  return Array.from(bySession.values())
    .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
    .slice(0, limit);
}
