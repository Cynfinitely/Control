"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import SegmentedControl from "@/components/SegmentedControl";
import { useToast } from "@/components/Toast";
import type { LocationResult, WeatherUnits } from "@/lib/weather/client";
import type { WeatherPreferenceView } from "@/lib/queries/weather";
import {
  clearWeatherLocation,
  saveWeatherLocation,
  searchWeatherLocations,
  type WeatherLocationInput,
} from "./actions";

const UNIT_OPTIONS = [
  { value: "metric", label: "Metric (°C, km/h)" },
  { value: "imperial", label: "Imperial (°F, mph)" },
] as const;

export default function WeatherLocationForm({ current }: { current: WeatherPreferenceView | null }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [units, setUnits] = useState<WeatherUnits>(current?.units ?? "metric");
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchWeatherLocations(q);
      if (cancelled) return;
      setSearching(false);
      if (res.ok) {
        setResults(res.results);
        setSearchError(null);
      } else {
        setResults([]);
        setSearchError(res.error);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function save(input: WeatherLocationInput) {
    startTransition(async () => {
      const res = await saveWeatherLocation(input);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        setQuery("");
        setResults([]);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function changeUnits(next: WeatherUnits) {
    setUnits(next);
    if (current) save({ ...current, units: next });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        save({
          locationName: "Current location",
          region: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          units,
        });
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Search for a city instead.");
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }

  function clear() {
    startTransition(async () => {
      const res = await clearWeatherLocation();
      if (res.ok) {
        toast.success(res.message ?? "Removed");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="card flex flex-col gap-4" aria-labelledby="weather-settings-title">
      <h2 id="weather-settings-title" className="section-title">
        Weather
      </h2>

      <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-900/60">
        <div className="flex min-w-0 items-start gap-2.5">
          <Icon name="cloud-sun" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {current ? current.locationName : "No location set"}
            </p>
            <p className="text-xs text-muted">
              {current
                ? current.region ?? `${current.latitude.toFixed(2)}, ${current.longitude.toFixed(2)}`
                : "Pick a location to see the forecast on Home and the Weather page."}
            </p>
          </div>
        </div>
        {current && (
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={clear} disabled={pending}>
            Clear
          </button>
        )}
      </div>

      <div>
        <label className="label" htmlFor="weather-search">
          {current ? "Change location" : "Search location"}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="weather-search"
            type="search"
            className="input"
            placeholder="City name, e.g. Helsinki"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            aria-describedby="weather-search-hint"
            aria-controls="weather-search-results"
          />
          <button
            type="button"
            className="btn-ghost touch-target shrink-0"
            onClick={useMyLocation}
            disabled={locating || pending}
          >
            <Icon name="target" className="h-4 w-4" />
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>
        <p id="weather-search-hint" className="hint" aria-live="polite">
          {searchError ??
            (searching
              ? "Searching…"
              : query.trim().length >= 2 && results.length === 0
                ? "No matching places."
                : "Type at least 2 characters.")}
        </p>
        {results.length > 0 && (
          <ul id="weather-search-results" className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {results.map((r) => (
              <li key={`${r.latitude},${r.longitude}`}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save({ locationName: r.name, region: r.region, latitude: r.latitude, longitude: r.longitude, units })}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-800/60"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
                    {r.region && <span className="text-muted"> · {r.region}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-brand-600 dark:text-brand-400">Select</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <span className="label">
          Units
        </span>
        <SegmentedControl
          options={UNIT_OPTIONS}
          value={units}
          onChange={changeUnits}
          aria-label="Weather units"
          disabled={pending}
        />
      </div>
    </section>
  );
}
