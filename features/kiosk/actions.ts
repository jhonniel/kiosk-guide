"use server";

import { db } from "@/lib/db";
import { feedbackSchema } from "@/lib/validations";

export async function submitFeedback(data: {
  name?: string;
  email?: string;
  rating?: number;
  message: string;
  category?: string;
}) {
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.feedback.create({ data: parsed.data });
  return { success: true };
}

export async function logVisitor(page: string, language?: string, sessionId?: string) {
  await db.visitorLog.create({
    data: { page, language, sessionId },
  });
}

export async function getSettings() {
  const { getResolvedSettings } = await import("@/features/settings/resolve-settings");
  return getResolvedSettings();
}

export async function getQuickLinks() {
  return db.quickLink.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getHomepageCards() {
  return db.homepageCard.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
