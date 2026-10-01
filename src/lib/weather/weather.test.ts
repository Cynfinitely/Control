import { describe, expect, it } from "vitest";
import { describeWeather } from "./codes";
import {
  forecastUrl,
  hoursForDay,
  normalizeForecast,
  normalizeLocations,
  type OpenMeteoForecastResponse,
} from "./client";
import { formatDayShort, formatHour, formatPrecip, formatTemp, formatWind } from "./format";

const SAMPLE: OpenMeteoForecastResponse = {
  timezone: "Europe/Helsinki",
  current: {
    time: "2026-10-01T14:15",
    temperature_2m: 9.4,
    apparent_temperature: 6.8,
    relative_humidity_2m: 81,
    wind_speed_10m: 18.2,
    precipitation: 0,
    weather_code: 3,
    is_day: 1,
  },
  hourly: {
    time: ["2026-10-01T13:00", "2026-10-01T14:00", "2026-10-01T15:00", "2026-10-02T00:00"],
    temperature_2m: [9, 9.4, 9.1, 6],
    precipitation_probability: [10, 20, null, 60],
    weather_code: [3, 3, 61, 63],
    wind_speed_10m: [17, 18, 19, 22],
    is_day: [1, 1, 1, 0],
  },
  daily: {
    time: ["2026-10-01", "2026-10-02"],
    weather_code: [61, 2],
    temperature_2m_max: [10.2, 12],
    temperature_2m_min: [5.1, 4.8],
    precipitation_sum: [2.4, 0],
    precipitation_probability_max: [70, null],
    wind_speed_10m_max: [24, 15],
    uv_index_max: [1.5, 2.1],
    sunrise: ["2026-10-01T07:24", "2026-10-02T07:27"],
    sunset: ["2026-10-01T18:52", "2026-10-02T18:49"],
  },
};

describe("describeWeather", () => {
  it("maps known codes with day/night icons", () => {
    expect(describeWeather(0)).toEqual({ label: "Clear", icon: "sun" });
    expect(describeWeather(0, false)).toEqual({ label: "Clear", icon: "moon" });
    expect(describeWeather(2, false).icon).toBe("cloud-moon");
    expect(describeWeather(63).icon).toBe("cloud-rain");
    expect(describeWeather(95).label).toBe("Thunderstorm");
  });

  it("falls back for unknown codes", () => {
    expect(describeWeather(42)).toEqual({ label: "Unknown", icon: "cloud" });
    expect(describeWeather(null)).toEqual({ label: "Unknown", icon: "cloud" });
  });
});

describe("normalizeForecast", () => {
  const forecast = normalizeForecast(SAMPLE, "metric");

  it("flattens Open-Meteo arrays into rows", () => {
    expect(forecast.current).toMatchObject({ temperature: 9.4, feelsLike: 6.8, code: 3, isDay: true });
    expect(forecast.hourly).toHaveLength(4);
    expect(forecast.hourly[2]).toMatchObject({ time: "2026-10-01T15:00", precipitationProbability: null, code: 61 });
    expect(forecast.daily[1]).toMatchObject({ date: "2026-10-02", tempMax: 12, precipitationProbability: null });
  });

  it("hoursForDay starts today at the current hour", () => {
    expect(hoursForDay(forecast, "2026-10-01").map((h) => h.time)).toEqual([
      "2026-10-01T14:00",
      "2026-10-01T15:00",
    ]);
    expect(hoursForDay(forecast, "2026-10-02")).toHaveLength(1);
  });
});

describe("normalizeLocations", () => {
  it("builds a region label without repeating the name", () => {
    expect(
      normalizeLocations({
        results: [
          { name: "Helsinki", latitude: 60.17, longitude: 24.94, admin1: "Uusimaa", country: "Finland" },
          { name: "Istanbul", latitude: 41.01, longitude: 28.95, admin1: "Istanbul", country: "Türkiye" },
          { name: "Nowhere", latitude: 0, longitude: 0 },
        ],
      })
    ).toEqual([
      { name: "Helsinki", region: "Uusimaa, Finland", latitude: 60.17, longitude: 24.94 },
      { name: "Istanbul", region: "Türkiye", latitude: 41.01, longitude: 28.95 },
      { name: "Nowhere", region: null, latitude: 0, longitude: 0 },
    ]);
    expect(normalizeLocations({})).toEqual([]);
  });
});

describe("forecastUrl", () => {
  it("rounds coordinates and switches units", () => {
    const metric = new URL(forecastUrl(60.16952, 24.93545, "metric"));
    expect(metric.searchParams.get("latitude")).toBe("60.17");
    expect(metric.searchParams.get("temperature_unit")).toBeNull();
    const imperial = new URL(forecastUrl(60.16952, 24.93545, "imperial"));
    expect(imperial.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(imperial.searchParams.get("wind_speed_unit")).toBe("mph");
  });
});

describe("format", () => {
  it("formats values and day labels", () => {
    expect(formatTemp(9.6)).toBe("10°");
    expect(formatWind(18.2, "metric")).toBe("18 km/h");
    expect(formatPrecip(2.44, "metric")).toBe("2.4 mm");
    expect(formatHour("2026-10-01T07:05")).toBe("07:05");
    expect(formatDayShort("2026-10-01", "2026-10-01")).toBe("Today");
    expect(formatDayShort("2026-10-02", "2026-10-01")).toBe("Tomorrow");
    expect(formatDayShort("2026-10-03", "2026-10-01")).toBe("Sat");
  });
});
