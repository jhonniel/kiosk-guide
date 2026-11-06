import type { KioskWeather, KioskWeatherHour } from "./types";

/** Mambajao, Camiguin (provincial capitol). Override with WEATHER_LATITUDE / WEATHER_LONGITUDE. */
const DEFAULT_LATITUDE = 9.2536;
const DEFAULT_LONGITUDE = 124.7172;
const LOCATION_NAME = "Camiguin";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 10 * 60 * 1000;
/** Keep showing the last reading during an internet outage, but not indefinitely. */
const STALE_LIMIT_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const HOURS_AHEAD = 6;

let cached: { data: KioskWeather; fetchedAt: number } | null = null;
let inFlight: Promise<KioskWeather> | null = null;

export class WeatherUnavailableError extends Error {
  constructor(message = "Weather is unavailable right now.") {
    super(message);
    this.name = "WeatherUnavailableError";
  }
}

function coordinate(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: (number | null)[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    is_day?: number[];
    precipitation_probability?: (number | null)[];
  };
};

/** Open-Meteo returns Manila local times without an offset. */
function manilaTime(local: string): Date {
  return new Date(`${local.length === 16 ? `${local}:00` : local}+08:00`);
}

function upcomingHours(hourly: OpenMeteoResponse["hourly"], after: Date): KioskWeatherHour[] {
  const times = hourly?.time ?? [];
  const hours: KioskWeatherHour[] = [];
  for (let i = 0; i < times.length && hours.length < HOURS_AHEAD; i += 1) {
    const at = manilaTime(times[i]);
    const temperature = hourly?.temperature_2m?.[i];
    const weatherCode = hourly?.weather_code?.[i];
    if (at <= after || typeof temperature !== "number" || typeof weatherCode !== "number") continue;
    hours.push({
      time: at.toISOString(),
      temperature,
      weatherCode,
      isDay: hourly?.is_day?.[i] !== 0,
      rainChance: hourly?.precipitation_probability?.[i] ?? null,
    });
  }
  return hours;
}

async function requestForecast(): Promise<KioskWeather> {
  const params = new URLSearchParams({
    latitude: String(coordinate(process.env.WEATHER_LATITUDE, DEFAULT_LATITUDE)),
    longitude: String(coordinate(process.env.WEATHER_LONGITUDE, DEFAULT_LONGITUDE)),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    hourly: "temperature_2m,weather_code,is_day,precipitation_probability",
    timezone: "Asia/Manila",
    forecast_days: "2",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${FORECAST_URL}?${params}`, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new WeatherUnavailableError(`Forecast service responded ${res.status}.`);
    const body = (await res.json()) as OpenMeteoResponse;
    const current = body.current;
    if (!current || typeof current.temperature_2m !== "number" || typeof current.weather_code !== "number") {
      throw new WeatherUnavailableError("Forecast service returned no current conditions.");
    }
    const observedAt = current.time ? manilaTime(current.time) : new Date();
    return {
      location: LOCATION_NAME,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
      humidity: current.relative_humidity_2m ?? 0,
      windSpeed: current.wind_speed_10m ?? 0,
      weatherCode: current.weather_code,
      isDay: current.is_day !== 0,
      todayMax: body.daily?.temperature_2m_max?.[0] ?? current.temperature_2m,
      todayMin: body.daily?.temperature_2m_min?.[0] ?? current.temperature_2m,
      rainChance: body.daily?.precipitation_probability_max?.[0] ?? null,
      observedAt: observedAt.toISOString(),
      hourly: upcomingHours(body.hourly, observedAt),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Current Camiguin weather, cached for 10 minutes; serves the last reading if the forecast service is down. */
export async function getCamiguinWeather(): Promise<KioskWeather> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return cached.data;

  inFlight ??= requestForecast()
    .then((data) => {
      cached = { data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  try {
    return await inFlight;
  } catch (error) {
    if (cached && now - cached.fetchedAt < STALE_LIMIT_MS) return cached.data;
    throw error instanceof WeatherUnavailableError ? error : new WeatherUnavailableError();
  }
}
