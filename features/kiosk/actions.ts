"use server";

import { db } from "@/lib/db";
import { feedbackSchema } from "@/lib/validations";
import { saveFeedback } from "@/features/feedback/save-feedback";
import { getDynamicQuickStartLinks } from "@/features/kiosk/get-dynamic-quick-start";
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import { logSearch } from "@/features/search/search-service";

export async function submitFeedback(data: {
  name?: string;
  email?: string;
  rating?: number;
  message?: string;
  category?: string;
  answers?: Record<string, number>;
}) {
  const parsed = feedbackSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await saveFeedback(parsed.data);
  return { success: true };
}

export async function logVisitor(page: string, language?: string, sessionId?: string) {
  await db.visitorLog.create({
    data: { page: normalizeVisitPage(page), language, sessionId },
  });
}

export async function logKioskSearch(query: string, results: number, sessionId?: string) {
  const term = query.trim().slice(0, 200);
  if (term.length < 2) return;
  await logSearch(term, Math.max(0, Math.trunc(Number(results) || 0)), sessionId?.slice(0, 64));
}

export async function getSettings() {
  const { getResolvedSettings } = await import("@/features/settings/resolve-settings");
  return getResolvedSettings();
}

export async function getQuickLinks() {
  return getDynamicQuickStartLinks();
}

export async function getHomepageCards() {
  return db.homepageCard.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
