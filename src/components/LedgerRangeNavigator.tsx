"use client";

import { useRouter } from "next/navigation";
import {
  buildBudgetUrl,
  shiftLedgerPeriod,
  type BudgetSearchParams,
  type LedgerPeriod,
} from "@/lib/budget-range";
import { toDateInputValue } from "@/lib/date";

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
    router.push(buildBudgetUrl(basePath, searchParams, updates));
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Spending log</h2>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                p.value === period
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={fromValue}
              onChange={(e) => {
                if (e.target.value) {
                  navigate({ ledger: "custom", from: e.target.value });
                }
              }}
              className="input"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={toValue}
              onChange={(e) => {
                if (e.target.value) {
                  navigate({ ledger: "custom", to: e.target.value });
                }
              }}
              className="input"
            />
          </div>
          <p className="pb-2 text-sm text-slate-500">{label}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(shiftLedgerPeriod(period, -1, refDay, monthKey))}
            className="btn-ghost touch-target px-3"
            aria-label={`Previous ${period}`}
          >
            ←
          </button>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
            <p className="text-xs text-slate-400 capitalize">{period} view</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(shiftLedgerPeriod(period, 1, refDay, monthKey))}
            className="btn-ghost touch-target px-3"
            aria-label={`Next ${period}`}
          >
            →
          </button>
          {period === "week" && !isCurrentWeek && (
            <button
              type="button"
              onClick={() => navigate({ day: todayValue, ledger: "week" })}
              className="btn-ghost text-xs"
            >
              This week
            </button>
          )}
          {period === "month" && !isCurrentMonth && (
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (searchParams.day && searchParams.day !== todayValue) {
                  params.set("day", searchParams.day);
                }
                params.set("ledger", "month");
                const qs = params.toString();
                router.push(qs ? `${basePath}?${qs}` : basePath);
              }}
              className="btn-ghost text-xs"
            >
              This month
            </button>
          )}
        </div>
      )}
    </div>
  );
}
