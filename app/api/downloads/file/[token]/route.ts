import { NextResponse } from "next/server";
import { validateDownloadToken } from "@/features/downloads/download-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await validateDownloadToken(token);

  if (!result) {
    return NextResponse.json(
      { error: "This download link is invalid or has expired." },
      { status: 410 }
    );
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
