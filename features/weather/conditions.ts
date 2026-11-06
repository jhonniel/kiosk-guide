import { pickLang, type Language } from "@/lib/i18n/translations";

export type WeatherArtKind =
  | "clear-day"
  | "clear-night"
  | "partly-day"
  | "partly-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "thunder"
  | "snow";

type Condition = {
  en: string;
  fil: string;
  bis: string;
  art: WeatherArtKind;
  nightArt?: WeatherArtKind;
};

const CLEAR: Condition = { en: "Clear sky", fil: "Maaliwalas", bis: "Tin-aw", art: "clear-day", nightArt: "clear-night" };
const MAINLY_CLEAR: Condition = { en: "Mostly clear", fil: "Halos maaliwalas", bis: "Halos tin-aw", art: "clear-day", nightArt: "clear-night" };
const PARTLY_CLOUDY: Condition = { en: "Partly cloudy", fil: "Bahagyang maulap", bis: "Medyo dag-umon", art: "partly-day", nightArt: "partly-night" };
const OVERCAST: Condition = { en: "Cloudy", fil: "Maulap", bis: "Dag-umon", art: "cloudy" };
const FOG: Condition = { en: "Foggy", fil: "Mahamog", bis: "Gabonon", art: "fog" };
const DRIZZLE: Condition = { en: "Drizzle", fil: "Ambon", bis: "Taligsik", art: "drizzle" };
const LIGHT_RAIN: Condition = { en: "Light rain", fil: "Mahinang ulan", bis: "Gamayng ulan", art: "drizzle" };
const RAIN: Condition = { en: "Rain", fil: "Umuulan", bis: "Nag-ulan", art: "rain" };
const HEAVY_RAIN: Condition = { en: "Heavy rain", fil: "Malakas na ulan", bis: "Kusog nga ulan", art: "heavy-rain" };
const SHOWERS: Condition = { en: "Rain showers", fil: "Pabugso-bugsong ulan", bis: "Pabugsu-bugso nga ulan", art: "rain" };
const THUNDERSTORM: Condition = { en: "Thunderstorm", fil: "Kulog at kidlat", bis: "Dalugdog ug kilat", art: "thunder" };
const SNOW: Condition = { en: "Snow", fil: "Niyebe", bis: "Niyebe", art: "snow" };

/** WMO weather interpretation codes used by Open-Meteo. */
function conditionFor(code: number): Condition {
  if (code === 0) return CLEAR;
  if (code === 1) return MAINLY_CLEAR;
  if (code === 2) return PARTLY_CLOUDY;
  if (code === 3) return OVERCAST;
  if (code === 45 || code === 48) return FOG;
  if (code >= 51 && code <= 57) return DRIZZLE;
  if (code === 61 || code === 66) return LIGHT_RAIN;
  if (code === 63) return RAIN;
  if (code === 65 || code === 67) return HEAVY_RAIN;
  if (code >= 71 && code <= 77) return SNOW;
  if (code >= 80 && code <= 82) return SHOWERS;
  if (code === 85 || code === 86) return SNOW;
  if (code >= 95) return THUNDERSTORM;
  return OVERCAST;
}

export function describeWeather(code: number, isDay: boolean, language: Language) {
  const condition = conditionFor(code);
  return {
    label: pickLang(language, condition.en, condition.fil, condition.bis),
    art: !isDay && condition.nightArt ? condition.nightArt : condition.art,
  };
}
