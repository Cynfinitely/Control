import { formatEuro, formatEuroSigned } from "@/lib/budget";
import type { MerchantSpend, MonthOverMonth, MonthSavingsPoint } from "@/lib/budget/analysis";

type Props = {
  mom: MonthOverMonth | null;
  merchants: MerchantSpend[];
  savingsSeries: MonthSavingsPoint[];
};

function deltaClass(cents: number) {
  if (cents > 0) return "text-emerald-600";
  if (cents < 0) return "text-red-600";
  return "text-slate-500";
}

function formatDelta(cents: number) {
  const sign = cents > 0 ? "+" : "";
  return `${sign}${formatEuro(cents)}`;
}

export default function BudgetAnalysisExtras({ mom, merchants, savingsSeries }: Props) {
  const maxMerchant = merchants[0]?.totalCents ?? 1;
  const rates = savingsSeries.map((p) => p.savingsRate).filter((r): r is number => r !== null);
  const minRate = rates.length ? Math.min(...rates, 0) : 0;
  const maxRate = rates.length ? Math.max(...rates, 0) : 1;
  const span = Math.max(1, maxRate - minRate);

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="card">
        <h2 className="section-title mb-3">vs previous month</h2>
        {!mom ? (
          <p className="text-sm text-slate-400">Need a previous month of data for comparison.</p>
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Income</dt>
              <dd className={deltaClass(mom.incomeDeltaCents)}>{formatDelta(mom.incomeDeltaCents)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Expenses</dt>
              <dd className={deltaClass(-mom.expenseDeltaCents)}>
                {formatDelta(mom.expenseDeltaCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Net</dt>
              <dd className={deltaClass(mom.netDeltaCents)}>{formatDelta(mom.netDeltaCents)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Savings rate</dt>
              <dd className="text-slate-700">
                {mom.savingsRateDelta === null
                  ? "—"
                  : `${mom.savingsRateDelta > 0 ? "+" : ""}${mom.savingsRateDelta} pts`}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="card">
        <h2 className="section-title mb-3">Top merchants</h2>
        {merchants.length === 0 ? (
          <p className="text-sm text-slate-400">No expenses this month.</p>
        ) : (
          <div className="space-y-3">
            {merchants.map((m) => (
              <div key={m.merchantKey}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-slate-700" title={m.label}>
                    {m.label}
                  </span>
                  <span className="shrink-0 text-slate-600">{formatEuro(m.totalCents)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-slate-500"
                    style={{ width: `${Math.round((m.totalCents / maxMerchant) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title mb-3">Savings rate trend</h2>
        {savingsSeries.length === 0 ? (
          <p className="text-sm text-slate-400">Import months to see a trend.</p>
        ) : (
          <>
            <svg viewBox="0 0 240 80" className="h-20 w-full text-brand-600" aria-hidden>
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={savingsSeries
                  .map((p, i) => {
                    const x = savingsSeries.length === 1 ? 120 : (i / (savingsSeries.length - 1)) * 220 + 10;
                    const rate = p.savingsRate ?? 0;
                    const y = 70 - ((rate - minRate) / span) * 55;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>{savingsSeries[0]?.monthKey}</span>
              <span>
                {savingsSeries[savingsSeries.length - 1]?.savingsRate === null
                  ? "—"
                  : `${savingsSeries[savingsSeries.length - 1]?.savingsRate}%`}
              </span>
              <span>{savingsSeries[savingsSeries.length - 1]?.monthKey}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Latest net {formatEuroSigned(savingsSeries[savingsSeries.length - 1]?.netCents ?? 0)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
