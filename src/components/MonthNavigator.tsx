"use client";

import { useRouter } from "next/navigation";
import { shiftPeriodDate } from "@/lib/period";
import { toMonthKey } from "@/lib/date";

type Props = {
  basePath: string;
  monthKey: string;
  monthLabel: string;
  dayValue?: string;
};

export default function MonthNavigator({ basePath, monthKey, monthLabel, dayValue }: Props) {
  const router = useRouter();
  const [year, month] = monthKey.split("-").map(Number);
  const ref = new Date(year, month - 1, 1);
  const todayKey = toMonthKey(new Date());
  const isCurrentMonth = monthKey === todayKey;

  function buildUrl(nextMonthKey: string) {
    const params = new URLSearchParams();
    params.set("month", nextMonthKey);
    if (dayValue) params.set("day", dayValue);
    return `${basePath}?${params.toString()}`;
  }

  function navigate(offset: number) {
    const next = shiftPeriodDate("monthly", offset, ref);
    router.push(buildUrl(toMonthKey(next)));
  }

  function goCurrentMonth() {
    const params = new URLSearchParams();
    if (dayValue) params.set("day", dayValue);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-ghost touch-target px-3"
        aria-label="Previous month"
      >
        ←
      </button>
      <div>
        <p className="font-semibold text-slate-900">{monthLabel}</p>
        <p className="text-xs text-slate-400">{monthKey}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate(1)}
        className="btn-ghost touch-target px-3"
        aria-label="Next month"
      >
        →
      </button>
      {!isCurrentMonth && (
        <button type="button" onClick={goCurrentMonth} className="btn-ghost text-xs">
          This month
        </button>
      )}
    </div>
  );
}
