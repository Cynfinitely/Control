import Link from "next/link";
import Icon from "@/components/Icon";
import type { Forecast } from "@/lib/weather/client";
import { describeWeather } from "@/lib/weather/codes";
import { formatDayShort, formatTemp } from "@/lib/weather/format";

/** Weekly view: one row per day, with each low→high bar placed on the week's range. */
export default function WeekForecast({ forecast }: { forecast: Forecast }) {
  const today = forecast.current.time.slice(0, 10);
  const weekMin = Math.min(...forecast.daily.map((d) => d.tempMin));
  const weekMax = Math.max(...forecast.daily.map((d) => d.tempMax));
  const span = Math.max(1, weekMax - weekMin);

  return (
    <section className="card" aria-labelledby="week-forecast-title">
      <h2 id="week-forecast-title" className="section-title mb-3">
        Next 7 days
      </h2>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {forecast.daily.map((d) => {
          const c = describeWeather(d.code);
          const left = ((d.tempMin - weekMin) / span) * 100;
          const width = Math.max(4, ((d.tempMax - d.tempMin) / span) * 100);
          return (
            <li key={d.date}>
              <Link
                href={`/dashboard/weather?view=day&day=${d.date}`}
                className="-mx-2 grid min-h-[52px] grid-cols-[4.5rem_1.5rem_1fr] items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 sm:grid-cols-[5.5rem_1.5rem_9rem_3rem_1fr]"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatDayShort(d.date, today)}</span>
                <Icon name={c.icon} className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="hidden truncate text-muted sm:block">{c.label}</span>
                <span className="hidden items-center gap-0.5 text-xs text-sky-600 tabular-nums dark:text-sky-400 sm:flex">
                  {(d.precipitationProbability ?? 0) > 0 && (
                    <>
                      <Icon name="droplet" className="h-3 w-3" />
                      {d.precipitationProbability}%
                    </>
                  )}
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="w-8 text-right text-muted">{formatTemp(d.tempMin)}</span>
                  <span className="relative h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                    <span
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                      style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                    />
                  </span>
                  <span className="w-8 font-medium text-slate-900 dark:text-slate-100">{formatTemp(d.tempMax)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
