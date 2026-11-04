import type { Language } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/translations";

export interface OfficeSchedule {
  /** Open days, 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Minutes after midnight. */
  open: number;
  close: number;
}

const DEFAULT_SCHEDULE: OfficeSchedule = { days: [1, 2, 3, 4, 5], open: 8 * 60, close: 17 * 60 };

const DAY_WORDS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const DAY_NAMES: Record<Language, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fil: ["Linggo", "Lunes", "Martes", "Miyerkules", "Huwebes", "Biyernes", "Sabado"],
  bis: ["Domingo", "Lunes", "Martes", "Miyerkoles", "Huwebes", "Biyernes", "Sabado"],
};

/** Monday first, the way the schedule is printed on office doors. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function dayName(day: number, lang: Language) {
  return (DAY_NAMES[lang] ?? DAY_NAMES.en)[day];
}

/**
 * Read the admin's free-text hours (e.g. "Monday to Friday, 8:00 AM – 5:00 PM").
 * Falls back to the standard government schedule when the text can't be read.
 */
export function parseOfficeSchedule(text: string | undefined): OfficeSchedule {
  if (!text) return DEFAULT_SCHEDULE;
  const lower = text.toLowerCase();

  let days = DEFAULT_SCHEDULE.days;
  const range = lower.match(/([a-z]+)\s*(?:to|through|thru|-|–|—)\s*([a-z]+)/);
  if (range && range[1] in DAY_WORDS && range[2] in DAY_WORDS) {
    const start = DAY_WORDS[range[1]];
    const end = DAY_WORDS[range[2]];
    days = [];
    for (let d = start; ; d = (d + 1) % 7) {
      days.push(d);
      if (d === end || days.length > 7) break;
    }
  }

  const times = [...lower.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/g)].map((m) => {
    let hour = Number(m[1]) % 12;
    if (m[3] === "pm") hour += 12;
    return hour * 60 + Number(m[2] ?? 0);
  });
  const open = times[0] ?? DEFAULT_SCHEDULE.open;
  const close = times[1] ?? DEFAULT_SCHEDULE.close;
  if (close <= open) return { ...DEFAULT_SCHEDULE, days };

  return { days, open, close };
}

export function formatClock(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export type OfficeStatus =
  | { open: true; closesAt: number; minutesLeft: number }
  | { open: false; opensDay: number; opensAt: number; opensToday: boolean; daysAhead: number };

export function officeStatus(schedule: OfficeSchedule, now: Date): OfficeStatus {
  const today = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const openToday = schedule.days.includes(today);

  if (openToday && minutes >= schedule.open && minutes < schedule.close) {
    return { open: true, closesAt: schedule.close, minutesLeft: schedule.close - minutes };
  }
  if (openToday && minutes < schedule.open) {
    return { open: false, opensDay: today, opensAt: schedule.open, opensToday: true, daysAhead: 0 };
  }
  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const day = (today + ahead) % 7;
    if (schedule.days.includes(day)) {
      return { open: false, opensDay: day, opensAt: schedule.open, opensToday: false, daysAhead: ahead };
    }
  }
  return { open: false, opensDay: today, opensAt: schedule.open, opensToday: false, daysAhead: 7 };
}

export function statusLine(status: OfficeStatus, lang: Language) {
  if (status.open) {
    const at = formatClock(status.closesAt);
    if (status.minutesLeft <= 60) {
      return pickLang(lang, `Closing soon · closes at ${at}`, `Malapit nang magsara · magsasara ng ${at}`, `Hapit na mosira · mosira sa ${at}`);
    }
    return pickLang(lang, `Closes today at ${at}`, `Magsasara ngayong ${at}`, `Mosira karon sa ${at}`);
  }
  const at = formatClock(status.opensAt);
  if (status.opensToday) {
    return pickLang(lang, `Opens today at ${at}`, `Magbubukas ngayong ${at}`, `Moabli karon sa ${at}`);
  }
  if (status.daysAhead === 1) {
    return pickLang(lang, `Opens tomorrow at ${at}`, `Magbubukas bukas ng ${at}`, `Moabli ugma sa ${at}`);
  }
  const day = dayName(status.opensDay, lang);
  return pickLang(lang, `Opens ${day} at ${at}`, `Magbubukas sa ${day} ng ${at}`, `Moabli sa ${day} sa ${at}`);
}
