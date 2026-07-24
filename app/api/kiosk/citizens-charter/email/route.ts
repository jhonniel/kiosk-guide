import { NextRequest, NextResponse } from "next/server";
import { sendCharterPdfByEmail } from "@/features/citizens-charter/email-charter-pdf";
import { charterPdfEmailRequestSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = charterPdfEmailRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    await sendCharterPdfByEmail(parsed.data.email, parsed.data.lang);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 400 }
    );
  }
}
