/**
 * Open-Meteo client (free, no API key). Server-only: called from server
 * components and server actions. Times are local wall-clock strings for the
 * forecast location ("2026-10-01T14:00"), because we request timezone=auto.
 */

export type WeatherUnits = "metric" | "imperial";

export type LocationResult = {
  name: string;
  region: string | null;
  latitude: number;
  longitude: number;
};

export type CurrentWeather = {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  code: number;
  isDay: boolean;
};

export type HourlyWeather = {
  time: string;
  temperature: number;
  precipitationProbability: number | null;
  code: number;
  windSpeed: number;
  isDay: boolean;
};

export type DailyWeather = {
  date: string;
  code: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number | null;
  windSpeedMax: number;
  uvIndexMax: number | null;
  sunrise: string;
  sunset: string;
};

export type Forecast = {
  timezone: string;
  units: WeatherUnits;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
/** Forecasts are shared per coordinate, so caching for 30 minutes is cheap and fresh enough. */
const FORECAST_REVALIDATE_SECONDS = 30 * 60;

type GeocodingResponse = {
  results?: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }[];
};

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const name = query.trim();
  if (name.length < 2) return [];
  const url = `${GEOCODING_URL}?${new URLSearchParams({ name, count: "6", language: "en", format: "json" })}`;
  const res = await fetch(url, { next: { revalidate: 24 * 60 * 60 } });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  return normalizeLocations((await res.json()) as GeocodingResponse);
}

export function normalizeLocations(data: GeocodingResponse): LocationResult[] {
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter((p) => p && p !== r.name).join(", ") || null,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export type OpenMeteoForecastResponse = {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
    wind_speed_10m: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    uv_index_max: (number | null)[];
    sunrise: string[];
    sunset: string[];
  };
};

/** Coordinates rounded to ~1 km so nearby users share the fetch cache. */
function roundCoord(n: number) {
  return n.toFixed(2);
}

export function forecastUrl(latitude: number, longitude: number, units: WeatherUnits) {
  const params = new URLSearchParams({
    latitude: roundCoord(latitude),
    longitude: roundCoord(longitude),
    timezone: "auto",
    forecast_days: "7",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day",
    hourly: "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset",
  });
  if (units === "imperial") {
    params.set("temperature_unit", "fahrenheit");
    params.set("wind_speed_unit", "mph");
    params.set("precipitation_unit", "inch");
  }
  return `${FORECAST_URL}?${params}`;
}

export async function getForecast(
  latitude: number,
  longitude: number,
  units: WeatherUnits
): Promise<Forecast> {
  const res = await fetch(forecastUrl(latitude, longitude, units), {
    next: { revalidate: FORECAST_REVALIDATE_SECONDS, tags: ["weather"] },
  });
  if (!res.ok) throw new Error(`Forecast failed: ${res.status}`);
  return normalizeForecast((await res.json()) as OpenMeteoForecastResponse, units);
}

export function normalizeForecast(data: OpenMeteoForecastResponse, units: WeatherUnits): Forecast {
  const { current: c, hourly: h, daily: d } = data;
  return {
    timezone: data.timezone,
    units,
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      precipitation: c.precipitation,
      code: c.weather_code,
      isDay: c.is_day === 1,
    },
    hourly: h.time.map((time, i) => ({
      time,
      temperature: h.temperature_2m[i],
      precipitationProbability: h.precipitation_probability[i] ?? null,
      code: h.weather_code[i],
      windSpeed: h.wind_speed_10m[i],
      isDay: h.is_day[i] === 1,
    })),
    daily: d.time.map((date, i) => ({
      date,
      code: d.weather_code[i],
      tempMax: d.temperature_2m_max[i],
      tempMin: d.temperature_2m_min[i],
      precipitationSum: d.precipitation_sum[i],
      precipitationProbability: d.precipitation_probability_max[i] ?? null,
      windSpeedMax: d.wind_speed_10m_max[i],
      uvIndexMax: d.uv_index_max[i] ?? null,
      sunrise: d.sunrise[i],
      sunset: d.sunset[i],
    })),
  };
}

/** Hours of `day` (YYYY-MM-DD); for today, starts at the current hour. */
export function hoursForDay(forecast: Forecast, day: string): HourlyWeather[] {
  const nowHour = forecast.current.time.slice(0, 13);
  return forecast.hourly.filter(
    (hour) => hour.time.startsWith(day) && (day !== forecast.current.time.slice(0, 10) || hour.time.slice(0, 13) >= nowHour)
  );
}
