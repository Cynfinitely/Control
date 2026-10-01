"use client";

import { useRouter } from "next/navigation";
import {
  buildBudgetUrl,
  shiftLedgerPeriod,
  type BudgetSearchParams,
  type LedgerPeriod,
} from "@/lib/budget-range";
import { toDateInputValue } from "@/lib/date";
import SegmentedControl from "@/components/SegmentedControl";
import StepNavigator from "@/components/StepNavigator";
import DateRangePicker from "@/components/DateRangePicker";

const PERIODS: { value: LedgerPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

type Props = {
  basePath: string;
  searchParams: BudgetSearchParams;
  period: LedgerPeriod;
  label: string;
  fromValue: string;
  toValue: string;
  refDay: Date;
  monthKey: string;
};

export default function LedgerRangeNavigator({
  basePath,
  searchParams,
  period,
  label,
  fromValue,
  toValue,
  refDay,
  monthKey,
}: Props) {
  const router = useRouter();
  const todayValue = toDateInputValue(new Date());
  const isCurrentWeek =
    period === "week" && toDateInputValue(refDay) === todayValue;
  const isCurrentMonth =
    period === "month" && monthKey === toDateInputValue(new Date()).slice(0, 7);

  function navigate(updates: Partial<BudgetSearchParams>) {
    router.push(buildBudgetUrl(basePath, searchParams, updates), { scroll: false });
  }

  function setPeriod(next: LedgerPeriod) {
    if (next === period) return;
    if (next === "custom") {
      navigate({
        ledger: "custom",
        from: fromValue,
        to: toValue,
      });
      return;
    }
    navigate({ ledger: next });
  }

  function goCurrentMonth() {
    const params = new URLSearchParams();
    if (searchParams.day && searchParams.day !== todayValue) {
      params.set("day", searchParams.day);
    }
    params.set("ledger", "month");
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Spending log</h2>
        <SegmentedControl
          aria-label="Ledger period"
          options={PERIODS}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {period === "custom" ? (
        <DateRangePicker
          from={fromValue}
          to={toValue}
          summary={label}
          onChange={(from, to) => navigate({ ledger: "custom", from, to })}
        />
      ) : (
        <StepNavigator
          label={label}
          sublabel={period === "week" ? "Week" : "Month"}
          prev={{ onClick: () => navigate(shiftLedgerPeriod(period, -1, refDay, monthKey)), label: `Previous ${period}` }}
          next={{ onClick: () => navigate(shiftLedgerPeriod(period, 1, refDay, monthKey)), label: `Next ${period}` }}
          reset={
            period === "week" && !isCurrentWeek
              ? { onClick: () => navigate({ day: todayValue, ledger: "week" }), label: "Go to this week", text: "This week" }
              : period === "month" && !isCurrentMonth
                ? { onClick: goCurrentMonth, label: "Go to this month", text: "This month" }
                : undefined
          }
        />
      )}
    </div>
  );
}
