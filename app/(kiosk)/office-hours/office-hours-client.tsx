"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, Info, Megaphone, Phone, type LucideIcon } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
import { getLocalizedSetting, getSetting } from "@/features/settings/settings-helpers";
import {
  WEEK_ORDER,
  dayName,
  formatClock,
  officeStatus,
  parseOfficeSchedule,
  statusLine,
} from "@/features/office-hours/schedule";
import { cn } from "@/lib/utils";

interface Props {
  settings: Record<string, string>;
}

/** Re-check open/closed every half minute so the status flips on time. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function NoteRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span className="text-sm leading-relaxed text-slate-600">{children}</span>
    </li>
  );
}

function ShortcutLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-300 active:bg-slate-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-kiosk-navy/5 text-kiosk-navy">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </Link>
  );
}

export function OfficeHoursClient({ settings }: Props) {
  const { language } = useKiosk();
  const now = useNow();
  const hoursText = getLocalizedSetting(settings, "office_hours", language);
  const schedule = useMemo(
    () => parseOfficeSchedule(getSetting(settings, "office_hours_en", hoursText)),
    [settings, hoursText]
  );
  const status = officeStatus(schedule, now);
  const today = now.getDay();
  const openRange = `${formatClock(schedule.open)} – ${formatClock(schedule.close)}`;
  const closedLabel = pickLang(language, "Closed", "Sarado", "Sirado");

  return (
    <div className="@container grid gap-4 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className={cn(
            "flex flex-col gap-4 border-b px-5 py-5 @xl:flex-row @xl:items-center @xl:justify-between sm:px-6",
            status.open ? "border-green-100 bg-green-50/60" : "border-slate-100 bg-slate-50/70"
          )}
        >
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                status.open ? "bg-kiosk-green text-white" : "bg-slate-200 text-slate-600"
              )}
            >
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {status.open ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kiosk-green opacity-60" />
                  ) : null}
                  <span
                    className={cn(
                      "relative inline-flex h-2.5 w-2.5 rounded-full",
                      status.open ? "bg-kiosk-green" : "bg-slate-400"
                    )}
                  />
                </span>
                <p className={cn("text-xl font-bold", status.open ? "text-green-700" : "text-slate-700")}>
                  {status.open
                    ? pickLang(language, "Open now", "Bukas ngayon", "Abli karon")
                    : pickLang(language, "Closed now", "Sarado ngayon", "Sirado karon")}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">{statusLine(status, language)}</p>
            </div>
          </div>
          <div className="text-left @xl:text-right">
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {pickLang(language, "Regular office hours", "Regular na oras ng opisina", "Regular nga oras sa opisina")}
            </p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{hoursText}</p>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays className="h-4 w-4 text-kiosk-navy" />
            {pickLang(language, "Weekly schedule", "Lingguhang iskedyul", "Iskedyul matag semana")}
          </p>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {WEEK_ORDER.map((day) => {
              const isToday = day === today;
              const isOpenDay = schedule.days.includes(day);
              return (
                <li
                  key={day}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-3",
                    isToday && "bg-kiosk-navy/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isOpenDay ? "bg-kiosk-green" : "bg-slate-300"
                      )}
                    />
                    <span className={cn("text-[0.95rem]", isToday ? "font-semibold text-kiosk-navy" : "text-slate-700")}>
                      {dayName(day, language)}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-kiosk-navy px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                        {pickLang(language, "Today", "Ngayon", "Karon")}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "text-[0.95rem] tabular-nums",
                      isOpenDay ? "font-medium text-slate-900" : "text-slate-400"
                    )}
                  >
                    {isOpenDay ? openRange : closedLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Info className="h-4 w-4 text-kiosk-navy" />
            {pickLang(language, "Good to know", "Mahalagang malaman", "Maayong mahibaloan")}
          </p>
          <ul className="space-y-3">
            <NoteRow icon={CalendarDays}>
              {pickLang(
                language,
                "Offices are closed on weekends and national holidays.",
                "Sarado ang mga opisina tuwing weekend at pambansang holiday.",
                "Sirado ang mga opisina sa weekend ug national holidays."
              )}
            </NoteRow>
            <NoteRow icon={Clock}>
              {pickLang(
                language,
                "Some offices keep their own hours. Check the Government Directory for a specific office.",
                "May sariling oras ang ilang opisina. Tingnan ang Government Directory para sa partikular na opisina.",
                "Ang ubang opisina adunay kaugalingong oras. Tan-awa ang Government Directory para sa usa ka opisina."
              )}
            </NoteRow>
            <NoteRow icon={Megaphone}>
              {pickLang(
                language,
                "Hours may change on special occasions. Check News & Announcements for advisories.",
                "Maaaring magbago ang oras sa espesyal na okasyon. Tingnan ang Balita at Anunsyo.",
                "Mahimong mausab ang oras sa espesyal nga okasyon. Tan-awa ang Balita ug Anunsyo."
              )}
            </NoteRow>
          </ul>
        </section>

        <section className="space-y-2">
          <ShortcutLink
            href="/news"
            icon={Megaphone}
            label={pickLang(language, "News & Announcements", "Balita at Anunsyo", "Balita ug Anunsyo")}
          />
          <ShortcutLink
            href="/contact"
            icon={Phone}
            label={pickLang(language, "Contact the Capitol", "Makipag-ugnayan sa Capitol", "Kontaka ang Capitol")}
          />
        </section>
      </aside>
    </div>
  );
}
