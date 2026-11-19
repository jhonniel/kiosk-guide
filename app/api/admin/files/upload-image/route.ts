import { NextRequest, NextResponse } from "next/server";
import { hasPermission, requireAdmin } from "@/lib/admin-auth";
import { KIOSK_IMAGE_FOLDERS, uploadKioskImage } from "@/features/storage/kiosk-image-upload";
import type { ImageFolder } from "@/features/admin/resource-definitions";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const folder = String(formData.get("folder") ?? "") as ImageFolder;
    const permission = KIOSK_IMAGE_FOLDERS[folder];
    if (!permission) {
      return NextResponse.json({ error: "Pictures cannot be uploaded here." }, { status: 400 });
    }
    if (!hasPermission(session, permission)) {
      return NextResponse.json({ error: "You do not have permission to do this." }, { status: 403 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    return NextResponse.json(await uploadKioskImage(file, folder));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
