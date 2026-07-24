"use client";

import {
  Building2,
  Calculator,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  Gavel,
  HeartPulse,
  Landmark,
  Leaf,
  Mail,
  MapPinned,
  Palmtree,
  Phone,
  Scale,
  Settings2,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Directory } from "@prisma/client";

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}

function departmentIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes("administrator")) return Landmark;
  if (lower.includes("general services")) return Settings2;
  if (lower.includes("budget")) return Coins;
  if (lower.includes("accounting")) return Calculator;
  if (lower.includes("treasury")) return Landmark;
  if (lower.includes("assessment")) return Scale;
  if (lower.includes("health")) return HeartPulse;
  if (lower.includes("social welfare")) return Users;
  if (lower.includes("agriculture")) return Leaf;
  if (lower.includes("veterinary")) return HeartPulse;
  if (lower.includes("engineering")) return Wrench;
  if (lower.includes("tourism")) return Palmtree;
  if (lower.includes("legal")) return Gavel;
  if (lower.includes("planning")) return MapPinned;
  return Building2;
}

function departmentTone(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("health") || lower.includes("veterinary")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  if (lower.includes("tourism") || lower.includes("agriculture")) {
    return "bg-teal-50 text-teal-700 ring-teal-100";
  }
  if (lower.includes("engineering") || lower.includes("general services")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  if (lower.includes("legal") || lower.includes("budget") || lower.includes("accounting")) {
    return "bg-sky-50 text-sky-700 ring-sky-100";
  }
  if (lower.includes("social")) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }
  return "bg-slate-50 text-kiosk-navy ring-slate-100";
}

export function GovernmentDirectoryClient({ directories }: { directories: Directory[] }) {
  const { language } = useKiosk();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => updateScrollHints();
    el.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollHints());
    resizeObserver.observe(el);

    window.addEventListener("resize", updateScrollHints);

    return () => {
      el.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollHints);
    };
  }, [directories.length, updateScrollHints]);

  if (!directories.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
        {pickLang(
          language,
          "No government offices available.",
          "Walang available na mga opisina.",
          "Walay available nga mga opisina."
        )}
      </p>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollerRef}
        className={cn(
          "directory-scroller min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden",
          canScrollLeft && canScrollRight && "directory-scroller-both",
          canScrollLeft && !canScrollRight && "directory-scroller-left",
          !canScrollLeft && canScrollRight && "directory-scroller-right"
        )}
        onWheel={(event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.currentTarget.scrollLeft += event.deltaY;
        }}
      >
        <div className="kiosk-stagger grid h-full auto-cols-[minmax(16.5rem,calc((100%-1rem)/2))] grid-flow-col grid-rows-2 gap-4 sm:auto-cols-[minmax(17rem,calc((100%-2rem)/3))] xl:auto-cols-[minmax(17rem,calc((100%-3rem)/4))]">
          {directories.map((dir) => {
            const officeName = localized(dir, language, "name");
            const Icon = departmentIcon(officeName);
            const phone = dir.contactNumber?.trim() || null;
            const href = phone ? telHref(phone) : undefined;
            const email = dir.email?.trim() || null;

            return (
              <article
                key={dir.id}
                className="group flex h-full min-h-0 w-full snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_-24px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(15,23,42,0.5)]"
              >
                <div className="flex shrink-0 items-start gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 px-4 py-3.5">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                      departmentTone(officeName)
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {pickLang(
                        language,
                        "Office / Department",
                        "Opisina / Departamento",
                        "Opisina / Departamento"
                      )}
                    </p>
                    <h3 className="mt-1 text-[14px] font-extrabold leading-snug tracking-tight text-kiosk-navy sm:text-[15px]">
                      {officeName}
                    </h3>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3.5">
                  <div className="shrink-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {pickLang(
                        language,
                        "Head / Name",
                        "Punong Opisyal / Pangalan",
                        "Punong Opisyal / Ngalan"
                      )}
                    </p>
                    <p className="flex items-start gap-2 text-[14px] font-semibold text-slate-800">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-navy/55" />
                      <span className="line-clamp-2">{dir.headName || "—"}</span>
                    </p>
                  </div>

                  <div className="min-h-0 shrink">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {pickLang(language, "Email", "Email", "Email")}
                    </p>
                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        className="flex items-start gap-2 text-[13px] font-semibold text-kiosk-navy hover:underline"
                      >
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-navy/55" />
                        <span className="line-clamp-2 break-all">{email}</span>
                      </a>
                    ) : (
                      <p className="flex items-start gap-2 text-[13px] font-medium text-slate-400">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{pickLang(language, "No email", "Walang email", "Walay email")}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-auto shrink-0">
                    {phone ? (
                      href ? (
                        <a
                          href={href}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-kiosk-navy px-3 py-2 text-sm font-bold text-white transition-transform duration-150 hover:bg-kiosk-navy/90 active:scale-[0.98]"
                        >
                          <Phone className="h-4 w-4 shrink-0 opacity-90" />
                          {phone}
                        </a>
                      ) : (
                        <span className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-kiosk-navy px-3 py-2 text-sm font-bold text-white">
                          <Phone className="h-4 w-4 shrink-0 opacity-90" />
                          {phone}
                        </span>
                      )
                    ) : (
                      <div className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
                        {pickLang(
                          language,
                          "No contact number",
                          "Walang contact number",
                          "Walay contact number"
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {canScrollRight && (
        <div className="directory-swipe-hint directory-swipe-hint-right pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 items-center justify-center sm:w-16">
          <ChevronsRight
            className="directory-swipe-hint-icon h-8 w-8 text-blue-600/75"
            strokeWidth={2.2}
            aria-hidden
          />
        </div>
      )}

      {canScrollLeft && (
        <div className="directory-swipe-hint directory-swipe-hint-left pointer-events-none absolute inset-y-0 left-0 z-10 flex w-14 items-center justify-center sm:w-16">
          <ChevronsLeft
            className="directory-swipe-hint-icon h-8 w-8 text-blue-600/75"
            strokeWidth={2.2}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
