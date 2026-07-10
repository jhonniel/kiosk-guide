import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

  await db.feedback.create({ data: parsed.data });
  return NextResponse.json({ success: true });
}
