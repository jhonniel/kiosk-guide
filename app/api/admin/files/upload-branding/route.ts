import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  uploadBrandingImage,
  type BrandingImageKind,
} from "@/features/storage/branding-upload";

const ALLOWED_KINDS = new Set<BrandingImageKind>(["logo", "footer"]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_KINDS.has(kind as BrandingImageKind)) {
      return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
    }

    const uploaded = await uploadBrandingImage(file, kind as BrandingImageKind);
    return NextResponse.json(uploaded);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
