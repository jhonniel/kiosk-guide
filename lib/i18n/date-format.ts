import { format } from "date-fns";
import type { Language } from "@/lib/i18n/translations";

const MONTHS: Record<Exclude<Language, "en">, string[]> = {
  fil: [
    "Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo",
    "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre",
  ],
  bis: [
    "Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo",
    "Hulyo", "Agosto", "Septiyembre", "Oktubre", "Nobyembre", "Disyembre",
  ],
};

const WEEKDAYS: Record<Exclude<Language, "en">, string[]> = {
  fil: ["Linggo", "Lunes", "Martes", "Miyerkules", "Huwebes", "Biyernes", "Sabado"],
  bis: ["Domingo", "Lunes", "Martes", "Miyerkoles", "Huwebes", "Biyernes", "Sabado"],
};

/**
 * date-fns `format` with month and weekday names in the visitor's language.
 * date-fns ships no Filipino or Cebuano locale, so MMMM / MMM / EEEE / EEE are
 * swapped for quoted names before formatting; every other token works as usual.
 */
export function formatLocalized(date: Date, pattern: string, lang: Language): string {
  if (lang === "en") return format(date, pattern);
  const months = MONTHS[lang];
  const days = WEEKDAYS[lang];
  const quote = (text: string) => `'${text.replace(/'/g, "''")}'`;
  const localizedPattern = pattern.replace(/MMMM|MMM|EEEE|EEE/g, (token) => {
    if (token === "MMMM") return quote(months[date.getMonth()]);
    if (token === "MMM") return quote(months[date.getMonth()].slice(0, 3));
    if (token === "EEEE") return quote(days[date.getDay()]);
    return quote(days[date.getDay()].slice(0, 3));
  });
  return format(date, localizedPattern);
}
