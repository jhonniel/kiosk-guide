"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Droplets, Thermometer, Umbrella, Wind } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { KioskFitPanel } from "@/components/kiosk/kiosk-fit-panel";
import { WeatherArt } from "@/components/kiosk/weather-art";
import { describeWeather, type WeatherArtKind } from "@/features/weather/conditions";
import type { KioskWeather } from "@/features/weather/types";
import { useCamiguinWeather } from "@/hooks/use-camiguin-weather";
import { useKiosk } from "@/hooks/use-kiosk";
import { formatLocalized } from "@/lib/i18n/date-format";
import { KIOSK_IDLE_ATTRACT_EVENT } from "@/lib/kiosk-events";
import { pickLang, type Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const degrees = (value: number) => `${Math.round(value)}°`;

function heroTone(art: WeatherArtKind): string {
  if (art === "clear-night" || art === "partly-night") return "from-indigo-100 via-slate-50 to-white";
  if (art === "clear-day" || art === "partly-day") return "from-amber-50 via-sky-50 to-white";
  if (art === "thunder" || art === "heavy-rain" || art === "rain") return "from-slate-200 via-sky-50 to-white";
  return "from-sky-100 via-slate-50 to-white";
}

/** Current Camiguin weather beside the date and clock; tap for the detailed forecast. */
export function WeatherWidget() {
  const { language } = useKiosk();
  const weather = useCamiguinWeather();
  const [open, setOpen] = useState(false);

  // The next visitor should not find the previous visitor's panel open.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(KIOSK_IDLE_ATTRACT_EVENT, close);
    return () => window.removeEventListener(KIOSK_IDLE_ATTRACT_EVENT, close);
  }, []);

  if (!weather) return null;

  const { label, art } = describeWeather(weather.weatherCode, weather.isDay, language);
  const rainLabel = pickLang(language, "Chance of rain", "Tsansa ng ulan", "Tsansa sa ulan");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="kiosk-weather pointer-events-auto flex h-[4.25rem] shrink-0 items-center gap-2.5 rounded-2xl bg-white py-2 pr-5 pl-3 text-left shadow-[0_8px_24px_-16px_rgba(15,35,70,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-16px_rgba(15,35,70,0.4)] active:scale-[0.97]"
        aria-label={pickLang(
          language,
          `Weather in ${weather.location}: ${degrees(weather.temperature)}C, ${label}. Tap for the forecast.`,
          `Panahon sa ${weather.location}: ${degrees(weather.temperature)}C, ${label}. Pindutin para sa forecast.`,
          `Panahon sa ${weather.location}: ${degrees(weather.temperature)}C, ${label}. Pindota para sa forecast.`
        )}
      >
        <WeatherArt kind={art} className="h-14 w-14 shrink-0" />
        <div className="min-w-0">
          <p className="flex items-baseline gap-2 whitespace-nowrap text-kiosk-navy">
            <span className="text-lg leading-none font-bold tabular-nums">{degrees(weather.temperature)}C</span>
            <span className="text-sm font-semibold">{label}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs whitespace-nowrap text-gray-500">
            <span>{weather.location}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {degrees(weather.todayMin)}–{degrees(weather.todayMax)}
            </span>
            {weather.rainChance != null ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5 tabular-nums" title={rainLabel}>
                  <Droplets className="h-3 w-3 text-sky-500" aria-hidden />
                  {weather.rainChance}%
                </span>
              </>
            ) : null}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <WeatherDetails weather={weather} language={language} label={label} art={art} />
      </Dialog>
    </>
  );
}

function WeatherDetails({
  weather,
  language,
  label,
  art,
}: {
  weather: KioskWeather;
  language: Language;
  label: string;
  art: WeatherArtKind;
}) {
  const [popKey, setPopKey] = useState(0);
  const hourly = weather.hourly ?? [];

  return (
    <DialogContent className="kiosk-weather-details flex max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] border-0 p-0 sm:max-w-none">
      <KioskFitPanel fit="height" className="min-h-0 flex-1" contentClassName="kiosk-weather-details__body flex flex-col">
        <section className={cn("kiosk-weather-details__hero relative bg-gradient-to-b px-7 pt-7 pb-6 text-center", heroTone(art))}>
          <DialogTitle className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
            {pickLang(language, `Weather in ${weather.location}`, `Panahon sa ${weather.location}`, `Panahon sa ${weather.location}`)}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xl font-bold text-kiosk-navy">{label}</DialogDescription>

          <button
            type="button"
            onClick={() => setPopKey((count) => count + 1)}
            className="mx-auto mt-2 block rounded-full focus-visible:outline-none"
            aria-label={label}
          >
            <span key={popKey} className={cn("block", popKey > 0 && "wx-pop")}>
              <WeatherArt kind={art} className="kiosk-weather-details__art h-44 w-44" />
            </span>
          </button>

          <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Stat
              icon={<Droplets className="h-5 w-5 text-sky-500" />}
              value={`${Math.round(weather.humidity)}%`}
              label={pickLang(language, "Humidity", "Halumigmig", "Kaumog")}
            />
            <p className="text-[4.5rem] leading-none font-light tracking-tight text-kiosk-navy tabular-nums">
              {degrees(weather.temperature)}
            </p>
            <Stat
              icon={<Wind className="h-5 w-5 text-slate-500" />}
              value={`${Math.round(weather.windSpeed)} km/h`}
              label={pickLang(language, "Wind", "Hangin", "Hangin")}
            />
          </div>
        </section>

        <section className="kiosk-weather-details__facts grid grid-cols-3 gap-2.5 border-t border-slate-100 bg-white px-5 py-4">
          <Detail
            icon={<Thermometer className="h-4 w-4 text-rose-500" />}
            label={pickLang(language, "Feels like", "Pakiramdam", "Gibati")}
            value={degrees(weather.apparentTemperature)}
          />
          <Detail
            icon={<Thermometer className="h-4 w-4 text-amber-500" />}
            label={pickLang(language, "Low – High", "Baba – Taas", "Ubos – Taas")}
            value={`${degrees(weather.todayMin)} – ${degrees(weather.todayMax)}`}
          />
          <Detail
            icon={<Umbrella className="h-4 w-4 text-sky-500" />}
            label={pickLang(language, "Chance of rain", "Tsansa ng ulan", "Tsansa sa ulan")}
            value={weather.rainChance != null ? `${weather.rainChance}%` : "—"}
          />
        </section>

        {hourly.length > 0 ? (
          <section className="bg-slate-50/80 px-5 pt-3 pb-5">
            <p className="mb-2.5 text-left text-xs font-bold tracking-[0.16em] text-slate-500 uppercase">
              {pickLang(language, "Next hours", "Susunod na oras", "Sunod nga mga oras")}
            </p>
            <ul className="kiosk-stagger grid grid-cols-6 gap-2">
              {hourly.map((hour) => {
                const hourArt = describeWeather(hour.weatherCode, hour.isDay, language);
                return (
                  <li
                    key={hour.time}
                    className="flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-white px-1 py-2.5 shadow-[0_4px_14px_-10px_rgba(15,35,70,0.35)]"
                    title={hourArt.label}
                  >
                    <span className="text-[11px] font-semibold whitespace-nowrap text-slate-500">
                      {formatLocalized(new Date(hour.time), "h a", language)}
                    </span>
                    <WeatherArt kind={hourArt.art} className="h-12 w-12" />
                    <span className="text-sm font-bold text-kiosk-navy tabular-nums">{degrees(hour.temperature)}</span>
                    {hour.rainChance != null ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-600 tabular-nums">
                        <Droplets className="h-2.5 w-2.5" aria-hidden />
                        {hour.rainChance}%
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <div className="flex items-center justify-between gap-3 bg-white px-5 py-3">
          <p className="text-[11px] text-slate-400">
            {pickLang(language, "Updated", "Na-update", "Na-update")} {formatLocalized(new Date(weather.observedAt), "h:mm a", language)}
          </p>
          <DialogClose className="min-h-11 shrink-0 rounded-xl bg-kiosk-navy px-6 text-sm font-semibold text-white transition hover:bg-kiosk-navy/90 active:scale-95">
            {pickLang(language, "Close", "Isara", "Isira")}
          </DialogClose>
        </div>
      </KioskFitPanel>
    </DialogContent>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {icon}
      <span className="text-sm font-bold text-kiosk-navy tabular-nums">{value}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 px-2 py-2.5 text-center">
      {icon}
      <span className="text-[11px] leading-tight text-slate-500">{label}</span>
      <span className="text-sm font-bold text-kiosk-navy tabular-nums">{value}</span>
    </div>
  );
}
