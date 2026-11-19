import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { uploadIndoorFloorPlan } from "@/features/indoor-map/upload";

export async function POST(req: Request) {
  try {
    await requirePermission("manage_indoor_map");
  } catch (e) {
    const unauthorized = e instanceof Error && e.message === "Unauthorized";
    return NextResponse.json(
      {
        success: false,
        error: unauthorized ? "Your session has ended. Sign in again." : "You do not have permission to edit the indoor map.",
      },
      { status: unauthorized ? 401 : 403 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
  }

  try {
    const result = await uploadIndoorFloorPlan(file);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.startsWith("File is too large") || message.startsWith("Unsupported file type")) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    console.error("[indoor-map upload]", e);
    return NextResponse.json({ success: false, error: "The floor plan could not be saved. Please try again." }, { status: 500 });
  }
}
