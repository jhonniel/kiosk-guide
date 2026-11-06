export interface KioskWeather {
  location: string;
  /** Degrees Celsius. */
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  /** km/h. */
  windSpeed: number;
  /** WMO weather interpretation code (Open-Meteo). */
  weatherCode: number;
  isDay: boolean;
  todayMax: number;
  todayMin: number;
  /** 0–100, highest chance of rain today. */
  rainChance: number | null;
  /** When the reading was taken (ISO). */
  observedAt: string;
  /** The next few hours, starting after the current reading. */
  hourly: KioskWeatherHour[];
}

export interface KioskWeatherHour {
  /** Start of the hour (ISO). */
  time: string;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  rainChance: number | null;
}
