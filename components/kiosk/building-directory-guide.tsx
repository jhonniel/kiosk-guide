"use client";

import { useMemo, useState, useRef, useEffect, useCallback, type AnimationEvent } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  Bath,
  Briefcase,
  Building2,
  FileText,
  Flame,
  HeartPulse,
  Landmark,
  Leaf,
  MapPin,
  Megaphone,
  Navigation,
  AlertCircle,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  PawPrint,
  Scale,
  Shield,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import type { Language } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { useOffline } from "@/components/providers/offline-provider";
import { resolveBuildingGuideOffline } from "@/features/offline/client-services";
import { cn } from "@/lib/utils";
import type { BuildingLocationData, GuideResponse } from "@/features/building-directory/types";
import { getLocationDisplay } from "@/features/building-directory/location-display";
import { hasCapitolOfficeFootprint } from "@/features/building-directory/navigation/building-3d";
import type { BuildingUiConfig } from "@/features/settings/building-config";

interface BuildingDirectoryGuideProps {
  isDemoMode: boolean;
  uiConfig: BuildingUiConfig;
  locations: BuildingLocationData[];
  initialQuery?: string;
  onLocationHighlight?: (locationId: string | null) => void;
  onStartNavigation?: (locationId: string, name: string, accessible: boolean) => void;
  currentFloor?: number;
  navigationActive?: boolean;
}

const OFFICE_MARKS: { test: RegExp; icon: LucideIcon; tone: string }[] = [
  { test: /comfort|restroom/, icon: Bath, tone: "bg-sky-100 text-sky-600" },
  { test: /pdrrmo|disaster/, icon: Flame, tone: "bg-red-100 text-red-500" },
  { test: /veterinary|\bvet\b/, icon: PawPrint, tone: "bg-emerald-100 text-emerald-600" },
  { test: /health/, icon: HeartPulse, tone: "bg-rose-100 text-rose-500" },
  { test: /people|human|hr\b/, icon: Users, tone: "bg-violet-100 text-violet-600" },
  { test: /agri|environment|natural/, icon: Leaf, tone: "bg-emerald-100 text-emerald-600" },
  { test: /assessor|treasury|budget|accounting/, icon: Landmark, tone: "bg-blue-100 text-blue-600" },
  { test: /social|welfare/, icon: Users, tone: "bg-teal-100 text-teal-600" },
  { test: /tourism/, icon: MapPin, tone: "bg-violet-100 text-violet-600" },
  { test: /legal/, icon: Scale, tone: "bg-orange-100 text-orange-500" },
  { test: /audit/, icon: Shield, tone: "bg-amber-100 text-amber-600" },
  { test: /information/, icon: Megaphone, tone: "bg-orange-100 text-orange-500" },
  { test: /archive/, icon: Archive, tone: "bg-sky-100 text-sky-600" },
  { test: /engineering|general services/, icon: Wrench, tone: "bg-slate-100 text-slate-600" },
  { test: /session|hall|conference|multi/, icon: Building2, tone: "bg-cyan-100 text-cyan-600" },
  { test: /governor|administrator|congress|secretariat|peso|planning|cpmc|bac|sanggunian/, icon: Briefcase, tone: "bg-indigo-100 text-indigo-600" },
];

function officeMark(id: string, name: string) {
  const key = `${id} ${name}`.toLowerCase();
  return OFFICE_MARKS.find((item) => item.test.test(key)) ?? {
    icon: FileText,
    tone: "bg-blue-100 text-blue-600",
  };
}

function officeListFade(canScrollUp: boolean, canScrollDown: boolean) {
  if (!canScrollUp && !canScrollDown) return undefined;
  const top = canScrollUp ? "transparent, #000 40px" : "#000 0";
  const bottom = canScrollDown ? "#000 calc(100% - 40px), transparent" : "#000 100%";
  return `linear-gradient(to bottom, ${top}, ${bottom})`;
}

function floorMark(floor: number) {
  if (floor === 1) return "G";
  return String(floor);
}

/**
 * Last floor colors (slate / cyan / green) + glass pill style.
 */
function floorOfficeTone(floor: number) {
  const glass =
    "rounded-full border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_20px_rgba(15,26,46,0.08)] backdrop-blur-xl";
  if (floor === 3) {
    return {
      header: cn(glass, "bg-slate-200/75 text-slate-900"),
      headerSelected: cn(glass, "bg-slate-200/90 text-slate-900 ring-2 ring-slate-400/50"),
      mark: "bg-kiosk-navy text-white",
      markIdle: "bg-slate-300/90 text-slate-800",
      pill: cn(glass, "bg-slate-100/70 text-slate-900"),
      pillActive: cn(glass, "bg-slate-200/85 text-slate-900 ring-2 ring-slate-400/60"),
      iconActive: "ring-2 ring-slate-400/80",
    };
  }
  if (floor === 2) {
    return {
      header: cn(glass, "bg-cyan-200/75 text-cyan-950"),
      headerSelected: cn(glass, "bg-cyan-200/90 text-cyan-950 ring-2 ring-cyan-400/50"),
      mark: "bg-cyan-700 text-white",
      markIdle: "bg-cyan-200/90 text-cyan-900",
      pill: cn(glass, "bg-cyan-100/70 text-cyan-950"),
      pillActive: cn(glass, "bg-cyan-200/85 text-cyan-950 ring-2 ring-cyan-400/60"),
      iconActive: "ring-2 ring-cyan-400/80",
    };
  }
  return {
    header: cn(glass, "bg-emerald-200/75 text-emerald-950"),
    headerSelected: cn(glass, "bg-emerald-200/90 text-emerald-950 ring-2 ring-emerald-400/50"),
    mark: "bg-kiosk-green text-white",
    markIdle: "bg-emerald-200/90 text-emerald-800",
    pill: cn(glass, "bg-emerald-100/70 text-emerald-950"),
    pillActive: cn(glass, "bg-emerald-200/85 text-emerald-950 ring-2 ring-kiosk-green/50"),
    iconActive: "ring-2 ring-kiosk-green/70",
  };
}

function isListedOffice(location: BuildingLocationData) {
  if (location.category === "entrance" || location.category === "emergency" || location.category === "service") {
    return false;
  }
  if (location.id.includes("elevator") || location.id.includes("stair")) return false;
  if (!hasCapitolOfficeFootprint(location.id)) return false;
  return location.locationType === "room" || location.id.includes("comfort-room");
}

export function BuildingDirectoryGuide({
  isDemoMode,
  uiConfig,
  locations,
  initialQuery,
  onLocationHighlight,
  onStartNavigation,
  currentFloor,
  navigationActive = false,
}: BuildingDirectoryGuideProps) {
  const { language, highContrast, screenReader } = useKiosk();
  const { offlineData } = useOffline();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GuideResponse | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(Boolean(initialQuery));
  const [closing, setClosing] = useState(false);
  const [panelBox, setPanelBox] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);

  function measurePanel() {
    const button = buttonRef.current;
    const map = button?.closest("aside")?.parentElement;
    const rail = button?.closest("aside");
    const rect = map?.getBoundingClientRect();
    if (!rect) return null;
    const margin = 24;
    const footer = 96;
    const railRect = rail?.getBoundingClientRect();
    const rightLimit = railRect ? railRect.left - margin : rect.right - margin;
    const leftLimit = rect.left + margin;
    const availableWidth = Math.max(320, rightLimit - leftLimit);
    const width = availableWidth;
    const availableTop = Math.max(rect.top, margin);
    const availableBottom = Math.min(rect.bottom, window.innerHeight - footer);
    const availableHeight = Math.max(220, availableBottom - availableTop);
    return {
      left: leftLimit + availableWidth / 2,
      top: availableTop + availableHeight / 2,
      width,
      maxHeight: availableHeight - margin,
    };
  }

  const accessibilityMode = highContrast || screenReader;

  const officeGroups = useMemo(() => {
    const grouped = new Map<number, { floor: number; label: string; offices: { id: string; name: string }[] }>();
    for (const location of locations) {
      if (!isListedOffice(location)) continue;
      const display = getLocationDisplay(location, language);
      const group = grouped.get(location.floor) ?? {
        floor: location.floor,
        label: display.floor,
        offices: [],
      };
      group.offices.push({ id: location.id, name: display.name });
      grouped.set(location.floor, group);
    }
    return [...grouped.values()]
      .sort((a, b) => a.floor - b.floor)
      .map((group) => ({
        ...group,
        offices: group.offices.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [locations, language]);

  function openOffice(id: string, name: string) {
    onLocationHighlight?.(id);
    onStartNavigation?.(id, name, accessibilityMode);
    requestClose();
  }

  async function handleAsk(searchQuery: string, locationId?: string) {
    const q = searchQuery.trim();
    if (!q && !locationId) return;

    setLoading(true);

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

  useEffect(() => {
    if (!open) return;
    const box = measurePanel();
    if (box) setPanelBox(box);
    const onResize = () => {
      const next = measurePanel();
      if (next) setPanelBox(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  function placePanel() {
    const box = measurePanel();
    if (box) setPanelBox(box);
  }

  function requestClose() {
    if (!open || closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(false);
      return;
    }
    setClosing(true);
  }

  function finishClose(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "guide-panel-out") return;
    setClosing(false);
    setOpen(false);
  }

  function togglePanel() {
    if (closing) {
      setClosing(false);
      return;
    }
    if (open) {
      requestClose();
      return;
    }
    placePanel();
    setOpen(true);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open && !closing}
        aria-label={uiText(language, "officesHeading")}
        onClick={togglePanel}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 text-left shadow-[0_8px_24px_rgba(26,39,68,0.10)] ring-1 ring-slate-200/90 transition-colors",
          open && "ring-blue-300"
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight text-kiosk-navy">{uiText(language, "officesHeading")}</span>
          <span className="mt-0.5 block truncate text-xs font-medium leading-tight text-slate-500">{uiText(language, "officesHint")}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && panelBox
        ? createPortal(
            <div
              className={cn(
                "fixed z-[90] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200",
                closing ? "guide-panel-out" : "guide-panel-in"
              )}
              style={{ left: panelBox.left, top: panelBox.top, width: panelBox.width, maxHeight: panelBox.maxHeight }}
              onAnimationEnd={finishClose}
            >
          {isDemoMode && (
            <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-800">{uiText(language, "demoMode")}</p>
                <p className="text-xs text-amber-700">{uiConfig.demoBanner}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold tracking-tight text-kiosk-navy">{uiText(language, "officesHeading")}</p>
                <p className="text-xs text-slate-500">{uiText(language, "officesHint")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label={uiText(language, "closeLabel")}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-sm font-semibold text-kiosk-navy shadow-sm transition-colors hover:border-kiosk-navy hover:bg-slate-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white">
                <X className="h-3.5 w-3.5" />
              </span>
              {uiText(language, "closeLabel")}
            </button>
          </div>

          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-5 py-3">
            {officeGroups.map((group) => {
              const selected = currentFloor === group.floor;
              return (
              <section key={group.floor}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                    selected ? "bg-kiosk-navy text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {floorMark(group.floor)}
                  </span>
                  <p className={cn(
                    "text-[11px] font-semibold tracking-[0.12em] uppercase",
                    selected ? "text-kiosk-navy" : "text-slate-500"
                  )}>
                    {group.label}
                  </p>
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium tabular-nums text-slate-400">{group.offices.length}</span>
                </div>
                <div
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${panelBox.width >= 1080 ? 5 : panelBox.width >= 760 ? 3 : 2}, minmax(0, 1fr))`,
                  }}
                >
                  {group.offices.map((office) => {
                    const mark = officeMark(office.id, office.name);
                    const Icon = mark.icon;
                    return (
                      <button
                        key={office.id}
                        type="button"
                        onClick={() => openOffice(office.id, office.name)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-left shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", mark.tone)}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-slate-800">{office.name}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              </section>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 shadow-sm">
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
            </div>,
            document.body
          )
        : null}
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

export function BuildingOfficeRail({
  locations,
  currentFloor,
  activeLocationId,
  onSelectOffice,
}: {
  locations: BuildingLocationData[];
  currentFloor?: number;
  activeLocationId?: string;
  /** Select an office (starts directions from the directory map). */
  onSelectOffice?: (locationId: string, name: string) => void;
}) {
  const { language } = useKiosk();
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [scrollBar, setScrollBar] = useState({ active: false, thumb: 0, top: 0 });
  const scrollIdle = useRef<number | null>(null);
  const officeGroups = useMemo(() => {
    const grouped = new Map<number, { floor: number; label: string; offices: { id: string; name: string }[] }>();
    for (const location of locations) {
      if (!isListedOffice(location)) continue;
      const display = getLocationDisplay(location, language);
      const group = grouped.get(location.floor) ?? {
        floor: location.floor,
        label: display.floor,
        offices: [],
      };
      group.offices.push({ id: location.id, name: display.name });
      grouped.set(location.floor, group);
    }
    return [...grouped.values()]
      .sort((a, b) => a.floor - b.floor)
      .map((group) => ({
        ...group,
        offices: group.offices.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [locations, language]);

  const updateScroll = useCallback((event?: Event) => {
    const el = listRef.current;
    if (!el) return;
    const overflow = el.scrollHeight > el.clientHeight + 4;
    setCanScrollDown(overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 12);
    setCanScrollUp(overflow && el.scrollTop > 12);
    if (!overflow) {
      setScrollBar({ active: false, thumb: 0, top: 0 });
      return;
    }
    const trackHeight = Math.max(el.clientHeight - 16, 0);
    const thumb = Math.max(36, (el.clientHeight / el.scrollHeight) * trackHeight);
    const travel = Math.max(trackHeight - thumb, 0);
    const top = ((el.scrollTop) / (el.scrollHeight - el.clientHeight)) * travel;
    if (event?.type !== "scroll") {
      setScrollBar((current) => ({ ...current, thumb, top }));
      return;
    }
    if (scrollIdle.current) window.clearTimeout(scrollIdle.current);
    setScrollBar({ active: true, thumb, top });
    scrollIdle.current = window.setTimeout(() => {
      setScrollBar((current) => ({ ...current, active: false }));
    }, 700);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateScroll();
    el.addEventListener("scroll", updateScroll, { passive: true });
    const observer = new ResizeObserver(() => updateScroll());
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScroll);
      observer.disconnect();
      if (scrollIdle.current) window.clearTimeout(scrollIdle.current);
    };
  }, [updateScroll, officeGroups]);

  useEffect(() => {
    const section = listRef.current?.querySelector(`[data-floor="${currentFloor}"]`);
    section?.scrollIntoView({ block: "nearest" });
    updateScroll();
  }, [currentFloor, updateScroll]);

  function scrollList(direction: "up" | "down") {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({
      top: direction === "down" ? Math.max(el.clientHeight * 0.7, 140) : -Math.max(el.clientHeight * 0.7, 140),
      behavior: "smooth",
    });
  }

  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 top-3 z-40 flex w-56 flex-col">
      <div className="pointer-events-auto flex items-center gap-2 px-1 py-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kiosk-navy text-white shadow-sm">
          <Building2 className="h-3.5 w-3.5" />
        </span>
        <p className="rounded-full border border-white/70 bg-white/75 px-2.5 py-0.5 text-sm font-semibold text-kiosk-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_20px_rgba(15,26,46,0.08)] backdrop-blur-xl">
          {uiText(language, "officesHeading")}
        </p>
      </div>
      <div className="pointer-events-auto relative min-h-0 flex-1">
      {scrollBar.thumb > 0 ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-2 left-0 top-2 z-20 w-1 transition-opacity duration-500",
            scrollBar.active ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className="absolute inset-x-0 rounded-full bg-[#3eb489]"
            style={{ height: scrollBar.thumb, transform: `translateY(${scrollBar.top}px)` }}
          />
        </div>
      ) : null}
      <div
        ref={listRef}
        className="kiosk-main-scroll relative z-10 h-full overflow-y-auto px-1 py-1"
        style={{
          maskImage: officeListFade(canScrollUp, canScrollDown),
          WebkitMaskImage: officeListFade(canScrollUp, canScrollDown),
        }}
      >
        {officeGroups.map((group) => {
          const selected = currentFloor === group.floor;
          const tone = floorOfficeTone(group.floor);
          return (
            <section key={group.floor} data-floor={group.floor} className="mb-3">
              <div className="mb-1.5 px-1">
                <p
                  className={cn(
                    "flex w-full items-center gap-2 px-1.5 py-1 text-sm font-bold",
                    selected ? tone.headerSelected : tone.header
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      selected ? tone.mark : tone.markIdle
                    )}
                  >
                    {floorMark(group.floor)}
                  </span>
                  {group.label}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                {group.offices.map((office) => {
                  const mark = officeMark(office.id, office.name);
                  const Icon = mark.icon;
                  const active = activeLocationId === office.id;
                  return (
                    <button
                      key={office.id}
                      type="button"
                      onClick={() => onSelectOffice?.(office.id, office.name)}
                      className="flex w-full items-center gap-2 px-1 py-1.5 text-left"
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-200",
                          mark.tone,
                          active && cn("scale-105", tone.iconActive)
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 px-2.5 py-0.5 text-[13px] font-semibold leading-snug transition-[background-color,box-shadow,border-color] duration-200",
                          active ? tone.pillActive : tone.pill
                        )}
                      >
                        {office.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {canScrollUp ? (
        <button
          type="button"
          onClick={() => scrollList("up")}
          aria-label="More offices above"
          className="absolute left-1/2 top-1 z-10 -translate-x-1/2 text-kiosk-navy drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
        >
          <ChevronsUp className="kiosk-scroll-hint-badge-up h-5 w-5" strokeWidth={2.5} />
        </button>
      ) : null}
      {canScrollDown ? (
        <button
          type="button"
          onClick={() => scrollList("down")}
          aria-label="More offices below"
          className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-kiosk-navy drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
        >
          <ChevronsDown className="kiosk-scroll-hint-badge h-5 w-5" strokeWidth={2.5} />
        </button>
      ) : null}
      </div>
    </aside>
  );
}
