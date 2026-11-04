import { db } from "@/lib/db";
import type { FeedbackInput } from "@/lib/validations";
import { averageFeedbackScore } from "./questions";

/** Store one kiosk feedback entry. The overall rating is the survey average when not given. */
export async function saveFeedback(input: FeedbackInput) {
  const { answers, ...rest } = input;
  await db.feedback.create({
    data: {
      ...rest,
      rating: rest.rating ?? (answers ? averageFeedbackScore(answers) : undefined),
      answers: answers ?? undefined,
    },
  });
}
