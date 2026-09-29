"use client";

import { useRouter } from "next/navigation";
import { addDays, startOfWeek, toDateInputValue, toMonthKey } from "@/lib/date";
import {
  buildFoodReportUrl,
  shiftFoodRange,
  type FoodRange,
  type FoodRangePreset,
  type FoodRangeSearchParams,
} from "@/lib/food/range";

const PRESETS: { value: FoodRangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "week", label: "This week" },
  { value: "last-week", label: "Last week" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "custom", label: "Custom" },
];

type Props = {
  searchParams: FoodRangeSearchParams;
  preset: FoodRangePreset;
  label: string;
  fromValue: string;
  toValue: string;
  anchor: string;
};

export default function FoodRangeNavigator({
  searchParams,
  preset,
  label,
  fromValue,
  toValue,
  anchor,
}: Props) {
  const router = useRouter();
  const today = new Date();
  const thisWeekStart = toDateInputValue(startOfWeek(today));
  const lastWeekStart = toDateInputValue(startOfWeek(addDays(today, -7)));
  const thisMonth = toMonthKey(today);
  const lastMonth = toMonthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  const canShift = preset === "week" || preset === "last-week" || preset === "month" || preset === "last-month";
  const onThisWeek = (preset === "week" || preset === "last-week") && fromValue === thisWeekStart;
  const onLastWeek = (preset === "week" || preset === "last-week") && fromValue === lastWeekStart;
  const onThisMonth = (preset === "month" || preset === "last-month") && anchor === thisMonth;
  const onLastMonth = (preset === "month" || preset === "last-month") && anchor === lastMonth;
  const showThisWeek = (preset === "week" || preset === "last-week") && !onThisWeek;
  const showThisMonth = (preset === "month" || preset === "last-month") && !onThisMonth;
  const viewHint =
    preset === "week" || preset === "last-week"
      ? "Week"
      : preset === "month" || preset === "last-month"
        ? "Month"
        : PRESETS.find((item) => item.value === preset)?.label;

  function chipActive(value: FoodRangePreset): boolean {
    if (value === "week") return onThisWeek;
    if (value === "last-week") return onLastWeek;
    if (value === "month") return onThisMonth;
    if (value === "last-month") return onLastMonth;
    return value === preset;
  }

  function navigate(updates: Partial<FoodRangeSearchParams>) {
    router.push(buildFoodReportUrl("/dashboard/food/report", searchParams, updates));
  }

  function setPreset(next: FoodRangePreset) {
    if (next === preset && next !== "week" && next !== "month") return;
    if (next === "custom") {
      navigate({ range: "custom", from: fromValue, to: toValue, anchor: undefined });
      return;
    }
    navigate({ range: next, anchor: undefined, from: undefined, to: undefined });
  }

  function shift(offset: number) {
    const range: FoodRange = {
      preset,
      from: new Date(fromValue + "T00:00:00"),
      to: new Date(toValue + "T00:00:00"),
      label,
      anchor,
    };
    navigate({ ...shiftFoodRange(range, offset), from: undefined, to: undefined });
  }

  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setPreset(item.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              chipActive(item.value)
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {preset === "custom" ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="food-range-from">
              From
            </label>
            <input
              id="food-range-from"
              type="date"
              value={fromValue}
              onChange={(e) => {
                if (e.target.value) navigate({ range: "custom", from: e.target.value, to: toValue });
              }}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="food-range-to">
              To
            </label>
            <input
              id="food-range-to"
              type="date"
              value={toValue}
              onChange={(e) => {
                if (e.target.value) navigate({ range: "custom", from: fromValue, to: e.target.value });
              }}
              className="input"
            />
          </div>
          <p className="pb-2 text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {canShift && (
            <button
              type="button"
              onClick={() => shift(-1)}
              className="btn-ghost touch-target px-3"
              aria-label="Previous range"
            >
              ←
            </button>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
            <p className="text-xs text-slate-400">{viewHint}</p>
          </div>
          {canShift && (
            <button
              type="button"
              onClick={() => shift(1)}
              className="btn-ghost touch-target px-3"
              aria-label="Next range"
            >
              →
            </button>
          )}
          {showThisWeek && (
            <button type="button" onClick={() => setPreset("week")} className="btn-ghost text-xs">
              This week
            </button>
          )}
          {showThisMonth && (
            <button type="button" onClick={() => setPreset("month")} className="btn-ghost text-xs">
              This month
            </button>
          )}
        </div>
      )}
    </div>
  );
}
