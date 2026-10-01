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
import SegmentedControl from "@/components/SegmentedControl";
import StepNavigator from "@/components/StepNavigator";
import DateRangePicker from "@/components/DateRangePicker";

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
    router.push(buildFoodReportUrl("/dashboard/food/report", searchParams, updates), { scroll: false });
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

  const activePreset = PRESETS.find((item) => chipActive(item.value))?.value ?? null;

  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="sm:hidden">
        <label htmlFor="food-range-preset" className="sr-only">
          Range
        </label>
        <select
          id="food-range-preset"
          className="input"
          value={activePreset ?? preset}
          onChange={(e) => setPreset(e.target.value as FoodRangePreset)}
        >
          {PRESETS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <SegmentedControl
        aria-label="Report range"
        className="hidden sm:inline-flex"
        options={PRESETS}
        value={activePreset}
        onChange={setPreset}
        size="sm"
      />

      {preset === "custom" ? (
        <DateRangePicker
          from={fromValue}
          to={toValue}
          summary={label}
          onChange={(from, to) => navigate({ range: "custom", from, to })}
        />
      ) : canShift ? (
        <StepNavigator
          label={label}
          sublabel={viewHint}
          prev={{ onClick: () => shift(-1), label: "Previous range" }}
          next={{ onClick: () => shift(1), label: "Next range" }}
          reset={
            showThisWeek
              ? { onClick: () => setPreset("week"), label: "Go to this week", text: "This week" }
              : showThisMonth
                ? { onClick: () => setPreset("month"), label: "Go to this month", text: "This month" }
                : undefined
          }
        />
      ) : (
        <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      )}
    </div>
  );
}
