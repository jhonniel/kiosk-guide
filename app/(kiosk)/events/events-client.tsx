"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang, type Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import {
  getEventDetailPack,
  type EventScheduleItem,
} from "@/features/events/event-details";
import type { Event } from "@prisma/client";

type EventCategory = "event" | "program" | "notice" | "advisory";

const CATEGORY_META: Record<
  EventCategory,
  {
    en: string;
    fil: string;
    bis: string;
    dot: string;
    badge: string;
    pill: string;
  }
> = {
  event: {
    en: "Event",
    fil: "Kaganapan",
    bis: "Kalihokan",
    dot: "bg-violet-500",
    badge: "bg-violet-500 text-white",
    pill: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  program: {
    en: "Program",
    fil: "Programa",
    bis: "Programa",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500 text-white",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  notice: {
    en: "Notice",
    fil: "Abiso",
    bis: "Abiso",
    dot: "bg-blue-500",
    badge: "bg-blue-500 text-white",
    pill: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  advisory: {
    en: "Advisory",
    fil: "Advisory",
    bis: "Advisory",
    dot: "bg-rose-500",
    badge: "bg-rose-500 text-white",
    pill: "bg-rose-50 text-rose-700 ring-rose-100",
  },
};

const FILTERS: Array<"all" | EventCategory> = [
  "all",
  "event",
  "program",
  "notice",
  "advisory",
];

function classifyEvent(title: string): EventCategory {
  const t = title.toLowerCase();
  if (/advisory|warning|typhoon|alert|preparedness|disaster/.test(t)) return "advisory";
  if (/notice|session|sanggunian|meeting|announcement|hearing/.test(t)) return "notice";
  if (
    /program|mission|fair|market|orientation|training|forum|kadiwa|clean|eco|dive|coastal|health|medical/.test(
      t
    )
  ) {
    return "program";
  }
  return "event";
}

function eventTone(title: string) {
  const category = classifyEvent(title);
  if (category === "event") {
    return {
      badge: "bg-violet-50 text-violet-800 ring-violet-100",
      accent: "from-violet-50 via-white to-fuchsia-50/40",
      chip: "bg-violet-100/80 text-violet-800",
      header: "from-violet-600 to-indigo-700",
    };
  }
  if (category === "program") {
    return {
      badge: "bg-emerald-50 text-emerald-800 ring-emerald-100",
      accent: "from-emerald-50 via-white to-teal-50/40",
      chip: "bg-emerald-100/80 text-emerald-800",
      header: "from-emerald-500 to-teal-600",
    };
  }
  if (category === "notice") {
    return {
      badge: "bg-blue-50 text-blue-800 ring-blue-100",
      accent: "from-blue-50 via-white to-sky-50/40",
      chip: "bg-blue-100/80 text-blue-800",
      header: "from-blue-500 to-indigo-600",
    };
  }
  return {
    badge: "bg-rose-50 text-rose-800 ring-rose-100",
    accent: "from-rose-50 via-white to-orange-50/40",
    chip: "bg-rose-100/80 text-rose-800",
    header: "from-rose-500 to-red-600",
  };
}

function formatEventWhen(start: Date, end: Date | null) {
  if (end && !isSameDay(start, end)) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return format(start, "MMM d, yyyy");
}

function pickField(language: Language, en?: string, fil?: string, bis?: string) {
  if (language === "fil") return fil || en || "";
  if (language === "bis") return bis || en || "";
  return en || "";
}

function pickList(language: Language, en?: string[], fil?: string[], bis?: string[]) {
  if (language === "fil") return fil?.length ? fil : en ?? [];
  if (language === "bis") return bis?.length ? bis : en ?? [];
  return en ?? [];
}

type ScheduleDay = {
  key: string;
  labelEn: string;
  labelFil: string;
  labelBis: string;
  items: EventScheduleItem[];
};

function groupScheduleByDay(schedule: EventScheduleItem[]): ScheduleDay[] {
  const days: ScheduleDay[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of schedule) {
    const key = item.dayEn;
    const existing = indexByKey.get(key);
    if (existing === undefined) {
      indexByKey.set(key, days.length);
      days.push({
        key,
        labelEn: item.dayEn,
        labelFil: item.dayFil,
        labelBis: item.dayBis,
        items: [item],
      });
    } else {
      days[existing].items.push(item);
    }
  }

  return days;
}

function eventTouchesDay(event: Event, day: Date) {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : start;
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return start <= dayEnd && end >= dayStart;
}

export function EventsClient({ events }: { events: Event[] }) {
  const { language } = useKiosk();
  const [selected, setSelected] = useState<Event | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | EventCategory>("all");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const initialMonth = useMemo(() => {
    const now = new Date();
    const upcoming = events.find((event) => new Date(event.endDate ?? event.startDate) >= now);
    return startOfMonth(upcoming ? new Date(upcoming.startDate) : events[0] ? new Date(events[0].startDate) : now);
  }, [events]);

  const [month, setMonth] = useState(initialMonth);

  function openEvent(event: Event) {
    setIsClosing(false);
    setSelected(event);
  }

  function closeEvent() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setSelected(null);
      setIsClosing(false);
    }, 280);
  }

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEvent();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((event) => {
        const cat = classifyEvent(event.titleEn);
        if (category !== "all" && cat !== category) return false;
        if (selectedDay && !eventTouchesDay(event, selectedDay)) return false;
        if (!q) return true;
        const title = localized(event, language, "title").toLowerCase();
        const description = localized(event, language, "description").toLowerCase();
        const location = (event.location ?? "").toLowerCase();
        return title.includes(q) || description.includes(q) || location.includes(q);
      })
      .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  }, [events, category, query, selectedDay, language]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, EventCategory[]>();
    for (const event of events) {
      if (category !== "all" && classifyEvent(event.titleEn) !== category) continue;
      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : start;
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const last = new Date(end);
      last.setHours(0, 0, 0, 0);
      while (cursor <= last) {
        const key = format(cursor, "yyyy-MM-dd");
        const list = map.get(key) ?? [];
        const cat = classifyEvent(event.titleEn);
        if (!list.includes(cat)) list.push(cat);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [events, category]);

  if (!events.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
        {pickLang(
          language,
          "No upcoming events available.",
          "Walang paparating na mga kaganapan.",
          "Walay umaabot nga mga kalihokan."
        )}
      </p>
    );
  }

  const weekdayLabels =
    language === "fil"
      ? ["Li", "Lu", "Ma", "Mi", "Hu", "Bi", "Sa"]
      : language === "bis"
        ? ["Do", "Lu", "Ma", "Mi", "Hu", "Bi", "Sa"]
        : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80">
          <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={pickLang(
                  language,
                  "Search events…",
                  "Maghanap ng mga kaganapan…",
                  "Pangita og mga kalihokan…"
                )}
                className="w-full rounded-xl border-0 bg-slate-50 py-3 pr-10 pl-11 text-sm text-slate-800 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-300/60"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-3 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={pickLang(language, "Clear search", "I-clear ang search", "I-clear ang search")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex gap-1.5 overflow-x-auto pt-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((key) => {
                const selectedFilter = category === key;
                const label =
                  key === "all"
                    ? pickLang(language, "All", "Lahat", "Tanan")
                    : pickLang(
                        language,
                        CATEGORY_META[key].en,
                        CATEGORY_META[key].fil,
                        CATEGORY_META[key].bis
                      );
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      "shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition",
                      selectedFilter
                        ? "bg-sky-600 text-white"
                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-kiosk-navy"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch">
            <aside className="flex shrink-0 flex-col border-b border-slate-100 bg-slate-50/40 p-3 lg:w-[240px] lg:border-r lg:border-b-0 xl:w-[280px] sm:p-4 lg:p-5">
              <div className="rounded-2xl bg-white p-2.5 ring-1 ring-slate-200/80 sm:p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMonth((value) => subMonths(value, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-kiosk-navy"
                    aria-label={pickLang(language, "Previous month", "Nakaraang buwan", "Miaging bulan")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-bold text-kiosk-navy">{format(month, "MMM yyyy")}</p>
                  <button
                    type="button"
                    onClick={() => setMonth((value) => addMonths(value, 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-kiosk-navy"
                    aria-label={pickLang(language, "Next month", "Susunod na buwan", "Sunod nga bulan")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-1">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="py-1 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const inMonth = isSameMonth(day, month);
                    const key = format(day, "yyyy-MM-dd");
                    const dayCats = eventsByDayKey.get(key) ?? [];
                    const active = selectedDay ? isSameDay(day, selectedDay) : false;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!inMonth}
                        onClick={() => {
                          if (!inMonth) return;
                          setSelectedDay((current) =>
                            current && isSameDay(current, day) ? null : day
                          );
                        }}
                        className={cn(
                          "relative flex h-7 flex-col items-center justify-center rounded-full text-[11px] font-semibold transition sm:h-8 sm:text-xs lg:h-9",
                          !inMonth && "invisible",
                          inMonth && !active && "text-slate-700 hover:bg-sky-50",
                          dayCats.length > 0 && !active && "bg-sky-50/80",
                          active && "bg-sky-600 text-white",
                          isToday(day) && !active && "ring-1 ring-sky-300"
                        )}
                      >
                        <span>{format(day, "d")}</span>
                        {dayCats.length > 0 ? (
                          <span className="absolute bottom-1 flex items-center gap-0.5">
                            {dayCats.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                className={cn(
                                  "h-1 w-1 rounded-full",
                                  active ? "bg-white/90" : CATEGORY_META[cat].dot
                                )}
                              />
                            ))}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 shrink-0 rounded-2xl bg-white p-4 ring-1 ring-slate-200/80">
                <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                  {pickLang(language, "Legend", "Legend", "Legend")}
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {(Object.keys(CATEGORY_META) as EventCategory[]).map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", CATEGORY_META[key].dot)} />
                      <span className="font-medium">
                        {pickLang(
                          language,
                          CATEGORY_META[key].en,
                          CATEGORY_META[key].fil,
                          CATEGORY_META[key].bis
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {selectedDay ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="mt-4 w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    {pickLang(
                      language,
                      `Showing ${format(selectedDay, "MMM d")} · Clear day`,
                      `Ipinapakita ang ${format(selectedDay, "MMM d")} · I-clear`,
                      `Gipakita ang ${format(selectedDay, "MMM d")} · I-clear`
                    )}
                  </button>
                ) : null}
              </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white p-4 sm:p-5">
              <div className="mb-3 shrink-0">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                  {pickLang(language, "Timeline", "Timeline", "Timeline")}
                </p>
                <h3 className="mt-0.5 text-base font-bold text-kiosk-navy">
                  {selectedDay
                    ? format(selectedDay, "EEEE, MMM d, yyyy")
                    : pickLang(
                        language,
                        "Upcoming public schedule",
                        "Paparating na pampublikong iskedyul",
                        "Umaabot nga pampublikong iskedyul"
                      )}
                </h3>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pt-1 pb-4 [scrollbar-gutter:stable]">
              {filtered.length === 0 ? (
                <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center text-sm text-slate-500">
                  {pickLang(
                    language,
                    "No events match your filters.",
                    "Walang tumugmang kaganapan sa filter.",
                    "Walay mohaum nga kalihokan sa filter."
                  )}
                </div>
              ) : (
                <ol className="relative space-y-4 pb-6 before:absolute before:top-3 before:bottom-3 before:left-[1.35rem] before:w-px before:bg-slate-200 sm:before:left-[1.55rem]">
                  {filtered.map((event) => {
                    const title = localized(event, language, "title");
                    const start = new Date(event.startDate);
                    const end = event.endDate ? new Date(event.endDate) : null;
                    const cat = classifyEvent(event.titleEn);
                    const meta = CATEGORY_META[cat];
                    const hasDetailSchedule = Boolean(
                      getEventDetailPack(event.titleEn)?.schedule?.length
                    );

                    return (
                      <li key={event.id} className="relative pl-12 sm:pl-14">
                        <div
                          className={cn(
                            "absolute top-0 left-0 flex h-11 w-11 flex-col items-center justify-center rounded-full text-white shadow-sm sm:h-12 sm:w-12",
                            meta.badge
                          )}
                        >
                          <span className="text-[9px] font-bold tracking-wide uppercase leading-none">
                            {format(start, "MMM")}
                          </span>
                          <span className="text-sm font-extrabold leading-none sm:text-base">
                            {format(start, "d")}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEvent(event)}
                          className="group flex w-full items-start gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)] sm:gap-4 sm:px-5 sm:py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                              <h4 className="line-clamp-2 text-[15px] font-bold leading-snug text-kiosk-navy sm:text-base">
                                {title}
                              </h4>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-4 text-xs font-medium text-slate-500 sm:text-[13px]">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                                {format(start, "h:mm a")}
                                {end && isSameDay(start, end) ? ` – ${format(end, "h:mm a")}` : ""}
                                {!end || isSameDay(start, end)
                                  ? ""
                                  : ` · ${formatEventWhen(start, end)}`}
                              </span>
                              {event.location ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="line-clamp-1">{event.location}</span>
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 pl-4 text-xs font-semibold text-blue-700 opacity-0 transition group-hover:opacity-100">
                              {hasDetailSchedule
                                ? pickLang(
                                    language,
                                    "View full schedule →",
                                    "Tingnan ang buong iskedyul →",
                                    "Tan-awa ang tibuok iskedyul →"
                                  )
                                : pickLang(
                                    language,
                                    "View details →",
                                    "Tingnan ang detalye →",
                                    "Tan-awa ang detalye →"
                                  )}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ring-1",
                              meta.pill
                            )}
                          >
                            {pickLang(language, meta.en, meta.fil, meta.bis)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <EventDetailModal
          event={selected}
          language={language}
          isClosing={isClosing}
          onClose={closeEvent}
        />
      )}
    </>
  );
}

function EventDetailModal({
  event,
  language,
  isClosing,
  onClose,
}: {
  event: Event;
  language: Language;
  isClosing: boolean;
  onClose: () => void;
}) {
  const title = localized(event, language, "title");
  const description = localized(event, language, "description");
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const tone = eventTone(event.titleEn);
  const pack = getEventDetailPack(event.titleEn);
  const overview = pack
    ? pickField(language, pack.overviewEn, pack.overviewFil, pack.overviewBis) || description
    : description;
  const highlights = pack
    ? pickList(language, pack.highlightsEn, pack.highlightsFil, pack.highlightsBis)
    : [];
  const schedule = pack?.schedule ?? [];
  const category = classifyEvent(event.titleEn);
  const meta = CATEGORY_META[category];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center bg-kiosk-navy/80 p-4 backdrop-blur-sm sm:p-6",
        isClosing ? "event-modal-backdrop-out" : "event-modal-backdrop-in"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
      onClick={onClose}
    >
      <article
        className={cn(
          "flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl will-change-transform",
          isClosing ? "event-modal-panel-out" : "event-modal-panel-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "relative shrink-0 bg-gradient-to-br px-4 py-4 text-white sm:px-5 sm:py-6 lg:px-7 lg:py-8",
            tone.header,
            !isClosing && "event-modal-header-in"
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-kiosk-navy shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-white active:scale-95"
            aria-label={pickLang(language, "Close event", "Isara ang kaganapan", "Isira ang kalihokan")}
          >
            <X className="h-5 w-5" />
          </button>

          <span
            className={cn(
              "inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase backdrop-blur-sm"
            )}
          >
            {pickLang(language, meta.en, meta.fil, meta.bis)}
          </span>
          <h2
            id="event-detail-title"
            className="mt-2 max-w-[90%] line-clamp-3 text-xl font-extrabold leading-tight sm:text-2xl lg:text-3xl"
          >
            {title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatEventWhen(start, end)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <Clock3 className="h-3.5 w-3.5" />
              {format(start, "h:mm a")}
              {end && isSameDay(start, end) ? ` – ${format(end, "h:mm a")}` : ""}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>

        <div className={cn("overflow-y-auto p-4 sm:p-5 lg:p-7", !isClosing && "event-modal-body-in")}>
          <p className="text-sm leading-7 text-slate-700 sm:text-base">{overview}</p>

          {highlights.length > 0 && (
            <section className="mt-6">
              <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-kiosk-navy uppercase">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {pickLang(language, "Highlights", "Mga Highlight", "Mga Highlight")}
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {highlights.map((item, index) => (
                  <li
                    key={item}
                    className={cn(
                      "rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-100",
                      !isClosing && "event-modal-item-in"
                    )}
                    style={!isClosing ? { animationDelay: `${220 + index * 55}ms` } : undefined}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {schedule.length > 0 && (
            <DayScheduleSection schedule={schedule} language={language} animate={!isClosing} />
          )}
        </div>
      </article>
    </div>
  );
}

function DayScheduleSection({
  schedule,
  language,
  animate,
}: {
  schedule: EventScheduleItem[];
  language: Language;
  animate: boolean;
}) {
  const days = useMemo(() => groupScheduleByDay(schedule), [schedule]);
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? "");
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    setSelectedDayKey(days[0]?.key ?? "");
    setListKey(0);
  }, [days]);

  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? days[0];
  const dayItems = selectedDay?.items ?? [];
  const showDayTabs = days.length > 1;

  function selectDay(key: string) {
    if (key === selectedDayKey) return;
    setSelectedDayKey(key);
    setListKey((value) => value + 1);
  }

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-sm font-extrabold tracking-wide text-kiosk-navy uppercase">
          {pickLang(language, "Detailed Schedule", "Detalyadong Iskedyul", "Detalyadong Iskedyul")}
        </h3>
        {selectedDay && (
          <p className="text-xs font-semibold text-slate-500">
            {pickLang(
              language,
              `${dayItems.length} event${dayItems.length === 1 ? "" : "s"} this day`,
              `${dayItems.length} kaganapan sa araw na ito`,
              `${dayItems.length} kalihokan niining adlawa`
            )}
          </p>
        )}
      </div>

      {showDayTabs && (
        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((day) => {
            const selected = day.key === selectedDay?.key;
            const label = pickField(language, day.labelEn, day.labelFil, day.labelBis);
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => selectDay(day.key)}
                className={cn(
                  "shrink-0 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200",
                  selected
                    ? "bg-kiosk-navy text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <span className="block text-sm font-extrabold leading-none">{label}</span>
                <span
                  className={cn(
                    "mt-1 block text-[10px] font-semibold",
                    selected ? "text-white/75" : "text-slate-500"
                  )}
                >
                  {pickLang(
                    language,
                    `${day.items.length} event${day.items.length === 1 ? "" : "s"}`,
                    `${day.items.length} kaganapan`,
                    `${day.items.length} kalihokan`
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedDay && (
        <div key={`${selectedDay.key}-${listKey}`} className="mt-4">
          <div
            className={cn(
              "mb-3 rounded-xl bg-gradient-to-r from-slate-50 to-sky-50 px-4 py-3 ring-1 ring-slate-100",
              animate && "event-modal-item-in"
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {pickLang(language, "Selected day", "Piniling araw", "Gipili nga adlaw")}
            </p>
            <p className="mt-0.5 text-base font-extrabold text-kiosk-navy">
              {pickField(language, selectedDay.labelEn, selectedDay.labelFil, selectedDay.labelBis)}
            </p>
          </div>

          <ol className="space-y-3">
            {dayItems.map((item, index) => (
              <ScheduleRow
                key={`${item.titleEn}-${index}`}
                item={item}
                language={language}
                animate={animate}
                delayMs={60 + index * 55}
                hideDayLabel
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function ScheduleRow({
  item,
  language,
  animate,
  delayMs,
  hideDayLabel,
}: {
  item: EventScheduleItem;
  language: Language;
  animate?: boolean;
  delayMs?: number;
  hideDayLabel?: boolean;
}) {
  const day = pickField(language, item.dayEn, item.dayFil, item.dayBis);
  const time = pickField(language, item.timeEn, item.timeFil, item.timeBis);
  const title = pickField(language, item.titleEn, item.titleFil, item.titleBis);
  const description = pickField(
    language,
    item.descriptionEn,
    item.descriptionFil,
    item.descriptionBis
  );

  return (
    <li
      className={cn(
        "flex gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-slate-200/80 sm:gap-4 sm:p-4",
        animate && "event-modal-item-in"
      )}
      style={animate ? { animationDelay: `${delayMs ?? 0}ms` } : undefined}
    >
      <div className="flex w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-xl bg-kiosk-navy/5 px-2 py-2 text-center sm:w-24">
        {hideDayLabel ? (
          <>
            <Clock3 className="h-4 w-4 text-kiosk-navy/60" />
            <span className="mt-1 text-[11px] font-extrabold leading-tight text-kiosk-navy sm:text-xs">
              {time || "—"}
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] font-extrabold leading-tight text-kiosk-navy sm:text-xs">
              {day}
            </span>
            {time ? (
              <span className="mt-1 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                {time}
              </span>
            ) : null}
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold leading-snug text-kiosk-navy sm:text-[15px]">{title}</h4>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
        {item.location ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {item.location}
          </p>
        ) : null}
      </div>
    </li>
  );
}
