"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  MapPin,
  Navigation,
  Search,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import type { Language } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { useOffline } from "@/components/providers/offline-provider";
import { resolveBuildingGuideOffline } from "@/features/offline/client-services";
import { cn } from "@/lib/utils";
import type { GuideResponse } from "@/features/building-directory/types";
import type { BuildingUiConfig } from "@/features/settings/building-config";

interface BuildingDirectoryGuideProps {
  isDemoMode: boolean;
  uiConfig: BuildingUiConfig;
  initialQuery?: string;
  onLocationHighlight?: (locationId: string | null) => void;
  onStartNavigation?: (locationId: string, name: string, accessible: boolean) => void;
  navigationActive?: boolean;
}

export function BuildingDirectoryGuide({
  isDemoMode,
  uiConfig,
  initialQuery,
  onLocationHighlight,
  onStartNavigation,
  navigationActive = false,
}: BuildingDirectoryGuideProps) {
  const { language, highContrast, screenReader } = useKiosk();
  const { offlineData } = useOffline();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GuideResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accessibilityMode = highContrast || screenReader;

  const quickQuestions = uiConfig.quickQuestions;

  async function handleAsk(searchQuery: string, locationId?: string) {
    const q = searchQuery.trim();
    if (!q && !locationId) return;

    setLoading(true);
    setQuery(q);

    try {
      if (offlineData) {
        const data = resolveBuildingGuideOffline(q || "selected location", offlineData, language, locationId);
        setResponse(data);
        if (data.type === "found" && data.location?.id) {
          onLocationHighlight?.(data.location.id);
        } else if (data.type !== "multiple") {
          onLocationHighlight?.(null);
        }
        return;
      }

      const params = new URLSearchParams({ q: q || "selected location", lang: language });
      if (locationId) params.set("locationId", locationId);

      const res = await fetch(`/api/building-directory/guide?${params}`);
      const data: GuideResponse = await res.json();
      setResponse(data);
      if (data.type === "found" && data.location?.id) {
        onLocationHighlight?.(data.location.id);
      } else if (data.type !== "multiple") {
        onLocationHighlight?.(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) {
      handleAsk(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAsk(query);
  }

  return (
    <div className="space-y-2.5">
      {isDemoMode && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-semibold text-amber-800">{uiText(language, "demoMode")}</p>
            <p className="text-xs text-amber-700">{uiConfig.demoBanner}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-kiosk-search p-3 shadow-sm sm:p-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-kiosk-navy">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-kiosk-navy">
                <Sparkles className="h-3.5 w-3.5 text-kiosk-green" />
                {uiConfig.guideTitle}
              </p>
              <p className="hidden text-[11px] leading-tight text-gray-600 lg:block">
                {uiConfig.guideSubtitle}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 gap-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={uiConfig.guidePlaceholder}
              className="min-w-0 flex-1 rounded-full border-0 bg-white px-4 py-2 text-sm shadow-inner outline-none ring-kiosk-green focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kiosk-navy text-white transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleAsk(q)}
              className="rounded-full border border-kiosk-navy/20 bg-white px-2.5 py-1 text-[11px] font-medium text-kiosk-navy transition-colors hover:bg-kiosk-navy hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-white py-5 shadow-md">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-kiosk-navy border-t-transparent" />
          <span className="text-sm text-gray-500">{uiText(language, "findingWay")}</span>
        </div>
      )}

      {response && response.type !== "demo_notice" && !loading && !navigationActive && (
        <GuideResponseCard
          response={response}
          language={language}
          accessibilityMode={accessibilityMode}
          onSelectMatch={(id, q) => handleAsk(q, id)}
          onStartNavigation={onStartNavigation}
        />
      )}
    </div>
  );
}

function GuideResponseCard({
  response,
  language,
  accessibilityMode,
  onSelectMatch,
  onStartNavigation,
}: {
  response: GuideResponse;
  language: Language;
  accessibilityMode: boolean;
  onSelectMatch: (id: string, query: string) => void;
  onStartNavigation?: (locationId: string, name: string, accessible: boolean) => void;
}) {
  const isEmergency = response.type === "emergency";

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-6 shadow-md",
        isEmergency && "border-2 border-red-200"
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            isEmergency ? "bg-red-100" : "bg-green-50"
          )}
        >
          {isEmergency ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <Navigation className="h-5 w-5 text-kiosk-green" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
            {response.message.replace(/\*\*(.*?)\*\*/g, "$1")}
          </p>
        </div>
      </div>

      {response.location && (
        <div className="mb-4 rounded-xl bg-kiosk-bg px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-kiosk-navy">
            <MapPin className="h-4 w-4 text-kiosk-green" />
            {uiText(language, "locationLabel")}{" "}
            {response.location.room
              ? `Room ${response.location.room} – ${response.location.name} (${response.location.floor})`
              : `${response.location.name} (${response.location.floor})`}
          </p>
          {response.location.nearbyLandmarks.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {uiText(language, "nearbyLabel")}{" "}
              {response.location.nearbyLandmarks.join(", ")}
            </p>
          )}
        </div>
      )}

      {response.directions && response.directions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold text-kiosk-navy">
            {uiText(language, "directionsLabel")}
          </p>
          <ol className="space-y-2">
            {response.directions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kiosk-navy text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {response.type === "found" && response.location?.id && onStartNavigation && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onStartNavigation(
                response.location!.id!,
                response.location!.name,
                accessibilityMode
              )
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kiosk-green px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Navigation className="h-4 w-4" />
            {uiText(language, "startNavigation")}
          </button>
          {accessibilityMode && onStartNavigation && (
            <button
              type="button"
              onClick={() =>
                onStartNavigation(response.location!.id!, response.location!.name, true)
              }
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-kiosk-navy px-4 py-3 text-sm font-semibold text-kiosk-navy"
            >
              {uiText(language, "accessibleRoute")}
            </button>
          )}
        </div>
      )}

      {response.type === "multiple" && response.matches && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-kiosk-navy">
            {uiText(language, "selectLocation")}
          </p>
          {response.matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => onSelectMatch(match.id, match.name)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left text-sm transition-colors hover:border-kiosk-green hover:bg-green-50"
            >
              <span>
                <span className="font-semibold text-kiosk-navy">{match.name}</span>
                {match.room && <span className="text-gray-500"> — Room {match.room}</span>}
                <span className="text-gray-400"> · {match.floor}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {response.type === "not_found" && response.suggestions && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-kiosk-navy">
            {uiText(language, "trySearching")}
          </p>
          <div className="flex flex-wrap gap-2">
            {response.suggestions.map((s) => (
              <span
                key={s}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
