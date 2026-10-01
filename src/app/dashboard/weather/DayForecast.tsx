import Link from "next/link";
import clsx from "clsx";
import Icon from "@/components/Icon";
import StatCard from "@/components/StatCard";
import { hoursForDay, type Forecast } from "@/lib/weather/client";
import { describeWeather } from "@/lib/weather/codes";
import {
  formatDayLong,
  formatDayShort,
  formatHour,
  formatPrecip,
  formatTemp,
  formatWind,
} from "@/lib/weather/format";

/** Daily view: pick one of the forecast days, then see it hour by hour. */
export default function DayForecast({ forecast, day }: { forecast: Forecast; day: string }) {
  const today = forecast.current.time.slice(0, 10);
  const daily = forecast.daily.find((d) => d.date === day) ?? forecast.daily[0];
  if (!daily) return null;
  const hours = hoursForDay(forecast, daily.date);
  const condition = describeWeather(daily.code);

  return (
    <div className="space-y-6">
      <nav aria-label="Forecast day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {forecast.daily.map((d) => {
          const active = d.date === daily.date;
          return (
            <Link
              key={d.date}
              href={`/dashboard/weather?view=day&day=${d.date}`}
              scroll={false}
              aria-current={active ? "date" : undefined}
              className={clsx(
                "flex min-w-[72px] shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs ring-1 ring-inset transition",
                active
                  ? "bg-brand-50 text-brand-700 ring-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-700"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
              )}
            >
              <span className="font-medium">{formatDayShort(d.date, today)}</span>
              <Icon name={describeWeather(d.code).icon} className="h-5 w-5" />
              <span className="tabular-nums">
                {formatTemp(d.tempMax)} <span className="text-muted">{formatTemp(d.tempMin)}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <section className="card" aria-labelledby="day-forecast-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="day-forecast-title" className="section-title">
            {formatDayLong(daily.date)}
          </h2>
          <p className="text-sm text-muted">
            {condition.label} · H {formatTemp(daily.tempMax)} · L {formatTemp(daily.tempMin)}
          </p>
        </div>

        {hours.length > 0 ? (
          <ol className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" aria-label="Hourly forecast">
            {hours.map((h) => {
              const c = describeWeather(h.code, h.isDay);
              return (
                <li
                  key={h.time}
                  className="flex min-w-[60px] shrink-0 flex-col items-center gap-1.5 rounded-lg px-2 py-2 text-xs odd:bg-slate-50 dark:odd:bg-slate-900/50"
                >
                  <span className="text-muted tabular-nums">{formatHour(h.time)}</span>
                  <Icon name={c.icon} className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  <span className="sr-only">{c.label}</span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                    {formatTemp(h.temperature)}
                  </span>
                  <span
                    className={clsx(
                      "flex items-center gap-0.5 tabular-nums",
                      (h.precipitationProbability ?? 0) >= 40 ? "text-sky-600 dark:text-sky-400" : "text-muted"
                    )}
                  >
                    <Icon name="droplet" className="h-3 w-3" />
                    {h.precipitationProbability ?? 0}%
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted">No hourly data for this day.</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Precipitation"
          value={formatPrecip(daily.precipitationSum, forecast.units)}
          hint={daily.precipitationProbability != null ? `${daily.precipitationProbability}% chance` : undefined}
          icon="cloud-rain"
          size="sm"
        />
        <StatCard label="Max wind" value={formatWind(daily.windSpeedMax, forecast.units)} icon="wind" size="sm" />
        <StatCard
          label="UV index"
          value={daily.uvIndexMax != null ? daily.uvIndexMax.toFixed(1) : "—"}
          hint={uvHint(daily.uvIndexMax)}
          icon="sun"
          size="sm"
        />
        <StatCard
          label="Daylight"
          value={`${formatHour(daily.sunrise)}–${formatHour(daily.sunset)}`}
          icon="sunrise"
          size="sm"
        />
      </div>
    </div>
  );
}

function uvHint(uv: number | null) {
  if (uv == null) return undefined;
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}
