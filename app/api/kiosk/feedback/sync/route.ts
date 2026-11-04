import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/features/feedback/save-feedback";
import { feedbackSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await saveFeedback(parsed.data);
  return NextResponse.json({ success: true });
}
