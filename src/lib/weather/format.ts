import { DateTime } from "luxon";
import type { WeatherUnits } from "./client";

/**
 * Open-Meteo times are already local to the forecast location, so they are
 * parsed and formatted as UTC wall-clock values (no zone conversion).
 */
function wallClock(value: string) {
  return DateTime.fromISO(value, { zone: "utc" });
}

export function formatTemp(value: number) {
  return `${Math.round(value)}°`;
}

export function formatWind(value: number, units: WeatherUnits) {
  return `${Math.round(value)} ${units === "imperial" ? "mph" : "km/h"}`;
}

export function formatPrecip(value: number, units: WeatherUnits) {
  return units === "imperial" ? `${value.toFixed(2)} in` : `${value.toFixed(1)} mm`;
}

export function tempUnitLabel(units: WeatherUnits) {
  return units === "imperial" ? "°F" : "°C";
}

/** "14:00" */
export function formatHour(time: string) {
  return wallClock(time).toFormat("HH:mm");
}

/** "Today", "Tomorrow", or "Fri" relative to `today` (YYYY-MM-DD). */
export function formatDayShort(date: string, today: string) {
  if (date === today) return "Today";
  if (date === wallClock(today).plus({ days: 1 }).toISODate()) return "Tomorrow";
  return wallClock(date).toFormat("ccc");
}

/** "Friday, 3 Oct" */
export function formatDayLong(date: string) {
  return wallClock(date).toFormat("cccc, d LLL");
}
