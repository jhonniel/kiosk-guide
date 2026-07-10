import { NextRequest, NextResponse } from "next/server";
import { sendDownloadByEmail } from "@/features/downloads/download-service";
import { downloadEmailRequestSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = downloadEmailRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    await sendDownloadByEmail(
      parsed.data.downloadId,
      parsed.data.email,
      parsed.data.lang
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 400 }
    );
  }
}
