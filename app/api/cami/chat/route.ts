import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWithCami } from "@/features/cami/chat-service";

const bodySchema = z.object({
  message: z.string().min(1).max(1200),
  language: z.enum(["en", "fil", "bis"]).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(12)
    .optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await answerWithCami({
      message: parsed.data.message,
      language: parsed.data.language ?? "en",
      history: parsed.data.history,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cami chat error:", error);
    return NextResponse.json(
      { error: "Cami is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
