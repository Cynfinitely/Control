import Icon from "@/components/Icon";
import type { Forecast } from "@/lib/weather/client";
import { describeWeather } from "@/lib/weather/codes";
import { formatHour, formatTemp, formatWind, tempUnitLabel } from "@/lib/weather/format";

/** Current conditions hero card. */
export default function WeatherNow({ forecast }: { forecast: Forecast }) {
  const { current, units } = forecast;
  const today = forecast.daily[0];
  const condition = describeWeather(current.code, current.isDay);

  const details = [
    { icon: "thermometer", label: "Feels like", value: formatTemp(current.feelsLike) },
    { icon: "droplet", label: "Humidity", value: `${Math.round(current.humidity)}%` },
    { icon: "wind", label: "Wind", value: formatWind(current.windSpeed, units) },
    ...(today
      ? [
          { icon: "sunrise", label: "Sunrise", value: formatHour(today.sunrise) },
          { icon: "sunset", label: "Sunset", value: formatHour(today.sunset) },
        ]
      : []),
  ];

  return (
    <section className="card mb-6" aria-labelledby="weather-now-title">
      <h2 id="weather-now-title" className="sr-only">
        Current conditions
      </h2>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Icon name={condition.icon} className="h-14 w-14 shrink-0 text-brand-600 dark:text-brand-400" />
          <div>
            <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatTemp(current.temperature)}
              <span className="ml-1 text-base font-medium text-muted">{tempUnitLabel(units)}</span>
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{condition.label}</p>
            {today && (
              <p className="text-xs text-muted">
                H {formatTemp(today.tempMax)} · L {formatTemp(today.tempMin)}
              </p>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {details.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <Icon name={d.icon} className="h-4 w-4 shrink-0 text-muted" />
              <dt className="text-muted">{d.label}</dt>
              <dd className="ml-auto font-medium text-slate-900 tabular-nums dark:text-slate-100 sm:ml-0">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
