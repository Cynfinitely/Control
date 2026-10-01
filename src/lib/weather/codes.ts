/** WMO weather interpretation codes (as returned by Open-Meteo) → label + Icon name. */

export type WeatherCondition = { label: string; icon: string };

const CODES: Record<number, { label: string; day: string; night?: string }> = {
  0: { label: "Clear", day: "sun", night: "moon" },
  1: { label: "Mainly clear", day: "sun", night: "moon" },
  2: { label: "Partly cloudy", day: "cloud-sun", night: "cloud-moon" },
  3: { label: "Overcast", day: "cloud" },
  45: { label: "Fog", day: "cloud-fog" },
  48: { label: "Freezing fog", day: "cloud-fog" },
  51: { label: "Light drizzle", day: "cloud-drizzle" },
  53: { label: "Drizzle", day: "cloud-drizzle" },
  55: { label: "Heavy drizzle", day: "cloud-drizzle" },
  56: { label: "Freezing drizzle", day: "cloud-drizzle" },
  57: { label: "Freezing drizzle", day: "cloud-drizzle" },
  61: { label: "Light rain", day: "cloud-rain" },
  63: { label: "Rain", day: "cloud-rain" },
  65: { label: "Heavy rain", day: "cloud-rain" },
  66: { label: "Freezing rain", day: "cloud-rain" },
  67: { label: "Freezing rain", day: "cloud-rain" },
  71: { label: "Light snow", day: "cloud-snow" },
  73: { label: "Snow", day: "cloud-snow" },
  75: { label: "Heavy snow", day: "cloud-snow" },
  77: { label: "Snow grains", day: "cloud-snow" },
  80: { label: "Rain showers", day: "cloud-rain" },
  81: { label: "Rain showers", day: "cloud-rain" },
  82: { label: "Heavy showers", day: "cloud-rain" },
  85: { label: "Snow showers", day: "cloud-snow" },
  86: { label: "Heavy snow showers", day: "cloud-snow" },
  95: { label: "Thunderstorm", day: "cloud-lightning" },
  96: { label: "Thunderstorm, hail", day: "cloud-lightning" },
  99: { label: "Thunderstorm, hail", day: "cloud-lightning" },
};

export function describeWeather(code: number | null | undefined, isDay = true): WeatherCondition {
  const entry = code == null ? undefined : CODES[code];
  if (!entry) return { label: "Unknown", icon: "cloud" };
  return { label: entry.label, icon: !isDay && entry.night ? entry.night : entry.day };
}
