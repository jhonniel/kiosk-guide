"use client";

import {
  isServiceVisitPage,
  normalizeVisitPage,
} from "@/features/kiosk/quick-start";

const STORAGE_KEY = "kiosk-visit-counts-v2";
const SESSION_KEY = "kiosk-session-id";

export function getKioskSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `session-${Date.now()}`;
  }
}

export function readLocalVisitCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const counts: Record<string, number> = {};
    for (const [page, value] of Object.entries(parsed)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) counts[normalizeVisitPage(page)] = n;
    }
    return counts;
  } catch {
    return {};
  }
}

export function recordLocalVisit(page: string): Record<string, number> {
  const key = normalizeVisitPage(page);
  const counts = readLocalVisitCounts();
  counts[key] = (counts[key] ?? 0) + 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // ignore quota / private mode
  }
  return counts;
}

export function mergeVisitCountsMax(
  ...sources: Array<Record<string, number> | undefined>
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [page, count] of Object.entries(source)) {
      const key = normalizeVisitPage(page);
      merged[key] = Math.max(merged[key] ?? 0, count);
    }
  }
  return merged;
}

export function serviceVisitCountsOnly(
  counts: Record<string, number>
): Record<string, number> {
  const filtered: Record<string, number> = {};
  for (const [page, count] of Object.entries(counts)) {
    if (isServiceVisitPage(page)) filtered[page] = count;
  }
  return filtered;
}
