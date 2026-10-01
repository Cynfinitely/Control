import Link from "next/link";
import Icon from "@/components/Icon";
import type { UserWeather } from "@/lib/queries/weather";
import { describeWeather } from "@/lib/weather/codes";
import { formatDayShort, formatTemp } from "@/lib/weather/format";

/** Compact weather card for Home. Renders a settings prompt without a location, nothing on fetch errors. */
export default function HomeWeatherCard({ weather }: { weather: UserWeather }) {
  if (!weather.pref) {
    return (
      <Link
        href="/dashboard/settings#weather-settings-title"
        className="card mb-2 flex items-center gap-3 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <Icon name="cloud-sun" className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-300">Set your location for weather</span>
        <Icon name="arrowRight" className="h-3.5 w-3.5 shrink-0 text-muted" />
      </Link>
    );
  }
  if ("error" in weather) return null;

  const { forecast, pref } = weather;
  const today = forecast.current.time.slice(0, 10);
  const condition = describeWeather(forecast.current.code, forecast.current.isDay);
  const todayDaily = forecast.daily[0];
  const outlook = forecast.daily.slice(1, 4);

  return (
    <Link
      href="/dashboard/weather"
      className="card mb-2 block py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
      aria-label={`Weather in ${pref.locationName}: ${formatTemp(forecast.current.temperature)}, ${condition.label}`}
    >
      <div className="flex items-center gap-3">
        <Icon name={condition.icon} className="h-9 w-9 shrink-0 text-brand-600 dark:text-brand-400" />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold leading-tight text-slate-900 tabular-nums dark:text-slate-100">
            {formatTemp(forecast.current.temperature)}
          </p>
          <p className="truncate text-xs text-muted">
            {condition.label} · {pref.locationName}
          </p>
        </div>
        {todayDaily && (
          <p className="shrink-0 text-right text-xs text-muted tabular-nums">
            H {formatTemp(todayDaily.tempMax)}
            <br />L {formatTemp(todayDaily.tempMin)}
          </p>
        )}
      </div>
      {outlook.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2 text-center text-xs dark:border-slate-800">
          {outlook.map((d) => (
            <li key={d.date} className="flex flex-col items-center gap-0.5">
              <span className="text-muted">{formatDayShort(d.date, today)}</span>
              <Icon name={describeWeather(d.code).icon} className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="tabular-nums text-slate-700 dark:text-slate-300">
                {formatTemp(d.tempMax)} <span className="text-muted">{formatTemp(d.tempMin)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
