import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { uploadIndoorFloorPlan } from "@/features/indoor-map/upload";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }
    const result = await uploadIndoorFloorPlan(file);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
