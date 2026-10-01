import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { getForecast, type Forecast, type WeatherUnits } from "@/lib/weather/client";

export type WeatherPreferenceView = {
  locationName: string;
  region: string | null;
  latitude: number;
  longitude: number;
  units: WeatherUnits;
};

export type UserWeather =
  | { pref: null }
  | { pref: WeatherPreferenceView; forecast: Forecast }
  | { pref: WeatherPreferenceView; error: true };

export function getWeatherPreference(userId: string): Promise<WeatherPreferenceView | null> {
  return cachedQuery(["weather-pref", userId], [cacheTag("weather", userId)], async () => {
    const pref = await prisma.weatherPreference.findUnique({
      where: { userId },
      select: { locationName: true, region: true, latitude: true, longitude: true, units: true },
    });
    if (!pref) return null;
    return { ...pref, units: pref.units === "imperial" ? "imperial" : "metric" };
  });
}

/** Weather is optional: never let the preference query or Open-Meteo take a page down. */
export async function getUserWeather(userId: string): Promise<UserWeather> {
  let pref: WeatherPreferenceView | null;
  try {
    pref = await getWeatherPreference(userId);
  } catch (err) {
    console.error("Weather preference query failed", err);
    return { pref: null };
  }
  if (!pref) return { pref: null };
  try {
    return { pref, forecast: await getForecast(pref.latitude, pref.longitude, pref.units) };
  } catch (err) {
    console.error("Weather forecast fetch failed", err);
    return { pref, error: true };
  }
}
