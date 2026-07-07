"use client";

import { useRouter } from "next/navigation";
import { addDays, toDateInputValue } from "@/lib/date";

type Props = {
  basePath: string;
  dayValue: string;
  dayLabel: string;
  maxDay?: string;
  monthKey?: string;
  sticky?: boolean;
};

export default function DayNavigator({
  basePath,
  dayValue,
  dayLabel,
  maxDay,
  monthKey,
  sticky = true,
}: Props) {
  const router = useRouter();
  const day = new Date(dayValue + "T00:00:00");
  const todayValue = toDateInputValue(new Date());
  const isToday = dayValue === todayValue;
  const nextDayValue = toDateInputValue(addDays(day, 1));
  const canGoNext = !maxDay || nextDayValue <= maxDay;

  function buildUrl(nextDay: string) {
    const params = new URLSearchParams();
    if (monthKey) params.set("month", monthKey);
    if (nextDay !== todayValue) params.set("day", nextDay);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function navigate(nextDay: string) {
    router.push(buildUrl(nextDay));
  }

  return (
    <div
      className={
        sticky
          ? "sticky top-14 z-30 -mx-1 rounded-lg bg-white/95 px-1 py-1 shadow-sm backdrop-blur dark:bg-slate-800/95 md:top-0"
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(toDateInputValue(addDays(day, -1)))}
          className="btn-ghost touch-target px-3"
          aria-label="Previous day"
        >
          ←
        </button>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{dayLabel}</p>
          <input
            type="date"
            value={dayValue}
            max={maxDay}
            onChange={(e) => {
              if (e.target.value) navigate(e.target.value);
            }}
            className="mt-0.5 border-0 bg-transparent p-0 text-xs text-slate-400 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Select day"
          />
        </div>
        <button
          type="button"
          onClick={() => canGoNext && navigate(nextDayValue)}
          disabled={!canGoNext}
          className="btn-ghost touch-target px-3"
          aria-label="Next day"
        >
          →
        </button>
        {!isToday && (
          <button type="button" onClick={() => navigate(todayValue)} className="btn-ghost text-xs">
            Today
          </button>
        )}
      </div>
    </div>
  );
}
