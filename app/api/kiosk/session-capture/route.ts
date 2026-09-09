import { NextRequest, NextResponse } from "next/server";
import { getBoolSetting, getResolvedSettings } from "@/features/settings/resolve-settings";
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import { saveKioskSessionCapture } from "@/features/kiosk/session-capture-service";

export const dynamic = "force-dynamic";

const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^session-\d+$/i;

export async function POST(request: NextRequest) {
  try {
    const settings = await getResolvedSettings();
    if (!getBoolSetting(settings, "kiosk_camera_tracking_enabled")) {
      return NextResponse.json({ error: "Camera tracking is disabled." }, { status: 403 });
    }

    const form = await request.formData();
    const sessionId = String(form.get("sessionId") ?? "").trim();
    const pageRaw = String(form.get("page") ?? "").trim();
    const language = String(form.get("language") ?? "").trim() || undefined;
    const image = form.get("image");

    if (!SESSION_ID_RE.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    }

    const page = normalizeVisitPage(pageRaw);
    if (!page) {
      return NextResponse.json({ error: "Invalid page." }, { status: 400 });
    }

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }

    const contentType = image.type || "image/jpeg";
    const buffer = Buffer.from(await image.arrayBuffer());

    const capture = await saveKioskSessionCapture({
      sessionId,
      page,
      language,
      imageBuffer: buffer,
      contentType,
    });

    return NextResponse.json({ success: true, id: capture.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save capture." },
      { status: 400 }
    );
  }
}
