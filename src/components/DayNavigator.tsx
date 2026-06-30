"use client";

import { useRouter } from "next/navigation";
import { addDays, toDateInputValue } from "@/lib/date";

type Props = {
  basePath: string;
  dayValue: string;
  dayLabel: string;
  maxDay?: string;
};

export default function DayNavigator({ basePath, dayValue, dayLabel, maxDay }: Props) {
  const router = useRouter();
  const day = new Date(dayValue + "T00:00:00");
  const todayValue = toDateInputValue(new Date());
  const isToday = dayValue === todayValue;
  const nextDayValue = toDateInputValue(addDays(day, 1));
  const canGoNext = !maxDay || nextDayValue <= maxDay;

  function navigate(nextDay: string) {
    if (nextDay === todayValue) {
      router.push(basePath);
      return;
    }
    router.push(`${basePath}?day=${nextDay}`);
  }

  return (
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
        <p className="font-semibold text-slate-900">{dayLabel}</p>
        <input
          type="date"
          value={dayValue}
          max={maxDay}
          onChange={(e) => {
            if (e.target.value) navigate(e.target.value);
          }}
          className="mt-0.5 border-0 bg-transparent p-0 text-xs text-slate-400 outline-none focus:ring-0"
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
  );
}
