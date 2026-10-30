"use client";

import { createPortal } from "react-dom";
import { Check, MapPin, Navigation, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { pickLang, type Language } from "@/lib/i18n/translations";

interface BuildingNavigationStopButtonProps {
  lang?: Language;
  onStop: () => void;
  className?: string;
}

export function BuildingNavigationStopButton({
  lang = "en",
  onStop,
  className,
}: BuildingNavigationStopButtonProps) {
  return (
    <button
      type="button"
      onClick={onStop}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-red-200/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 active:bg-red-100",
        className
      )}
      aria-label={lang === "en" ? "Stop navigation" : "Itigil ang navigation"}
    >
      <Square className="h-3 w-3 fill-current" />
      {lang === "en" ? "Stop" : "Itigil"}
    </button>
  );
}

interface BuildingNavigationHudProps {
  lang?: Language;
  destinationName: string;
  floorLabel: string;
  progress: number;
  distanceMeters?: number;
  estimatedMinutes?: number;
  onStop: () => void;
}

export function BuildingNavigationHud({
  lang = "en",
  destinationName,
  floorLabel,
  progress,
  distanceMeters,
  estimatedMinutes,
  onStop,
}: BuildingNavigationHudProps) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <div className="pointer-events-auto absolute bottom-3 left-64 right-16 z-20">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(26,39,68,0.14)] ring-1 ring-slate-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-kiosk-green">
            <Navigation className="h-4 w-4" />
          </div>
          <div className="min-w-0 max-w-[16rem] shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kiosk-green">
              {lang === "en" ? "Navigating" : "Nag-navigate"}
            </p>
            <p className="truncate text-sm font-semibold text-kiosk-navy">{destinationName}</p>
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              <MapPin className="h-3.5 w-3.5 text-kiosk-green" />
              {floorLabel}
            </span>
            {distanceMeters != null && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                {distanceMeters} m
              </span>
            )}
            {estimatedMinutes != null && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                {estimatedMinutes} min
              </span>
            )}
          </div>
          <BuildingNavigationStopButton lang={lang} onStop={onStop} className="shrink-0 rounded-full px-3.5 py-2" />
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-kiosk-green transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface BuildingArrivalModalProps {
  lang?: Language;
  destinationName: string;
  floorLabel: string;
  onDone: () => void;
}

export function BuildingArrivalModal({
  lang = "en",
  destinationName,
  floorLabel,
  onDone,
}: BuildingArrivalModalProps) {
  if (typeof document === "undefined") return null;

  const title = pickLang(lang, "Navigation ends here", "Dito nagtatapos ang navigation", "Dinhi mahuman ang navigation");
  const doneLabel = pickLang(lang, "Done", "Tapos", "Human na");

  return createPortal(
    <div
      className="charter-modal-backdrop-in fixed inset-0 z-[95] flex items-center justify-center bg-kiosk-navy/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arrival-title"
    >
      <div className="charter-modal-panel-in w-full max-w-sm rounded-3xl bg-white px-6 py-7 text-center shadow-2xl ring-1 ring-slate-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-kiosk-green">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h2 id="arrival-title" className="mt-4 text-xl font-bold text-kiosk-navy">
          {title}
        </h2>
        <p className="mt-2 text-base font-semibold text-kiosk-navy">{destinationName}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-kiosk-green" />
          {floorLabel}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 w-full rounded-2xl bg-kiosk-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-kiosk-navy-dark"
        >
          {doneLabel}
        </button>
      </div>
    </div>,
    document.body
  );
}
