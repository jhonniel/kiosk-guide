"use client";

import { Pause, Play, X, Navigation, Volume2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/translations";
import type { useBuildingNavigation } from "@/hooks/use-building-navigation";

type NavigationState = ReturnType<typeof useBuildingNavigation>;

interface BuildingNavigationPanelProps {
  nav: NavigationState;
  destinationName: string;
  lang?: Language;
  onClose: () => void;
}

export function BuildingNavigationPanel({
  nav,
  destinationName,
  lang = "en",
  onClose,
}: BuildingNavigationPanelProps) {
  const isNavigating = nav.status === "navigating" || nav.status === "paused";
  const hasArrived = nav.status === "arrived";

  return (
    <div className="space-y-4 rounded-2xl border-2 border-kiosk-green/30 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-kiosk-green" />
          <h3 className="font-bold text-kiosk-navy">
            {hasArrived
              ? lang === "en"
                ? "You have arrived at your destination."
                : "Nakarating ka na sa iyong destinasyon."
              : lang === "en"
                ? `Navigating to ${destinationName}`
                : `Papunta sa ${destinationName}`}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            nav.cancel();
            onClose();
          }}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Cancel navigation"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {nav.isDemoMode && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {lang === "en"
            ? "Follow the blue path on the map above. The blue figure shows your position along the route."
            : "Sundin ang asul na linya sa map sa itaas."}
        </p>
      )}

      {nav.currentInstruction && isNavigating && (
        <div className="flex items-start gap-3 rounded-xl bg-kiosk-bg px-4 py-3">
          <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-green" />
          <p className="text-sm font-medium text-kiosk-navy">{nav.currentInstruction}</p>
        </div>
      )}

      {hasArrived && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-4">
          <CheckCircle2 className="h-8 w-8 text-kiosk-green" />
          <div>
            <p className="font-bold text-kiosk-navy">{destinationName}</p>
            <p className="text-sm text-gray-600">
              {lang === "en" ? "You have arrived at your destination." : "Nakarating ka na sa iyong destinasyon."}
            </p>
          </div>
        </div>
      )}

      {nav.textOnly && nav.textDirections.length > 0 && (
        <ol className="space-y-2">
          {nav.textDirections.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kiosk-navy text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {nav.route && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-kiosk-navy">
            {lang === "en" ? "All voice guidance steps" : "Lahat ng voice guidance steps"}
          </summary>
          <ol className="mt-2 space-y-1 pl-4">
            {nav.route.voiceInstructions.map((step, i) => (
              <li
                key={i}
                className={cn(
                  "text-gray-600",
                  i === nav.instructionIndex && isNavigating && "font-semibold text-kiosk-green"
                )}
              >
                {step}
              </li>
            ))}
          </ol>
        </details>
      )}

      {nav.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{nav.error}</p>
      )}

      {isNavigating && (
        <div className="flex gap-2">
          {nav.status === "paused" ? (
            <button
              type="button"
              onClick={nav.resume}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kiosk-green py-2.5 text-sm font-semibold text-white"
            >
              <Play className="h-4 w-4" />
              {lang === "en" ? "Resume" : "Ituloy"}
            </button>
          ) : (
            <button
              type="button"
              onClick={nav.pause}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-kiosk-navy py-2.5 text-sm font-semibold text-kiosk-navy"
            >
              <Pause className="h-4 w-4" />
              {lang === "en" ? "Pause" : "I-pause"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              nav.cancel();
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700"
          >
            <X className="h-4 w-4" />
            {lang === "en" ? "Cancel" : "Kanselahin"}
          </button>
        </div>
      )}

      {nav.route && !nav.textOnly && (
        <p className="text-center text-xs text-gray-400">
          {lang === "en"
            ? `Walking distance: ~${nav.route.totalDistanceMeters}m · Est. ${nav.route.estimatedMinutes} min · ${Math.round(nav.progress * 100)}%`
            : `Distansya: ~${nav.route.totalDistanceMeters}m · Est. ${nav.route.estimatedMinutes} min · ${Math.round(nav.progress * 100)}%`}
        </p>
      )}
    </div>
  );
}
