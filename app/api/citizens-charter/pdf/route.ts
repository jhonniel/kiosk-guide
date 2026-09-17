import { NextResponse } from "next/server";
import { assertDownloadFileAvailable } from "@/features/downloads/file-resolver";
import { db } from "@/lib/db";

/** Serves the published Citizens' Charter PDF through the app (never a raw Spaces URL). */
export async function GET() {
  const edition = await db.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      pdfUrl: true,
      pdfFileName: true,
      year: true,
    },
  });

  if (!edition?.pdfUrl) {
    return NextResponse.json({ error: "Citizens' Charter PDF is not available." }, { status: 404 });
  }

  const fileName =
    edition.pdfFileName?.trim() || `Citizens-Charter-${edition.year}.pdf`;

  try {
    const file = await assertDownloadFileAvailable({
      fileUrl: edition.pdfUrl,
      fileName,
    });

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${file.fileName}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Citizens' Charter PDF is not available." }, { status: 404 });
  }
}
