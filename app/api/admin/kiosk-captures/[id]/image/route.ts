import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import {
  getKioskCaptureById,
  resolveCaptureAbsolutePath,
} from "@/features/kiosk/session-capture-service";

export const dynamic = "force-dynamic";

function contentTypeForPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("manage_kiosk_tracking");
    const { id } = await context.params;
    const capture = await getKioskCaptureById(id);
    if (!capture) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const absolutePath = resolveCaptureAbsolutePath(capture.imagePath);
    const buffer = await readFile(absolutePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentTypeForPath(capture.imagePath),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message === "Unauthorized" || message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
