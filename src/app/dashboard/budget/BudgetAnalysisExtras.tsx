import { formatEuro, formatEuroSigned } from "@/lib/budget";
import { periodLabel } from "@/lib/period";
import type { MerchantSpend, MonthOverMonth, MonthSavingsPoint } from "@/lib/budget/analysis";
import EmptyState from "@/components/EmptyState";

type Props = {
  mom: MonthOverMonth | null;
  merchants: MerchantSpend[];
  savingsSeries: MonthSavingsPoint[];
};

/** Color for a delta where positive is good (income, net) or bad (expenses: pass `invert`). */
function deltaClass(cents: number, invert = false) {
  const good = invert ? cents < 0 : cents > 0;
  const bad = invert ? cents > 0 : cents < 0;
  if (good) return "text-green-700 dark:text-green-400";
  if (bad) return "text-red-600 dark:text-red-400";
  return "text-slate-600 dark:text-slate-400";
}

/** "▲ €120.00 more" / "▼ €40.00 less" / "No change": never color alone. */
function Delta({ cents, invert = false }: { cents: number; invert?: boolean }) {
  if (cents === 0) return <dd className={deltaClass(0)}>No change</dd>;
  const up = cents > 0;
  return (
    <dd className={`tabular-nums ${deltaClass(cents, invert)}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      {formatEuro(Math.abs(cents))} {up ? "more" : "less"}
    </dd>
  );
}

function monthName(key: string | undefined) {
  return key ? periodLabel("monthly", key) : "—";
}

export default function BudgetAnalysisExtras({ mom, merchants, savingsSeries }: Props) {
  const maxMerchant = merchants[0]?.totalCents ?? 1;
  const rates = savingsSeries.map((p) => p.savingsRate).filter((r): r is number => r !== null);
  const minRate = rates.length ? Math.min(...rates, 0) : 0;
  const maxRate = rates.length ? Math.max(...rates, 0) : 1;
  const span = Math.max(1, maxRate - minRate);
  const first = savingsSeries[0];
  const last = savingsSeries[savingsSeries.length - 1];

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="card">
        <h2 className="section-title mb-3">vs previous month</h2>
        {!mom ? (
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="chart"
            title="No comparison yet"
            description="Import the previous month to compare."
          />
        ) : (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Income</dt>
              <Delta cents={mom.incomeDeltaCents} />
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Expenses</dt>
              <Delta cents={mom.expenseDeltaCents} invert />
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Net</dt>
              <Delta cents={mom.netDeltaCents} />
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Savings rate</dt>
              <dd className="tabular-nums text-slate-700 dark:text-slate-100">
                {mom.savingsRateDelta === null
                  ? "—"
                  : mom.savingsRateDelta === 0
                    ? "No change"
                    : `${mom.savingsRateDelta > 0 ? "▲ +" : "▼ "}${mom.savingsRateDelta} pts`}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className="card">
        <h2 className="section-title mb-3">Top merchants</h2>
        {merchants.length === 0 ? (
          <EmptyState variant="inline" headingLevel="h3" icon="wallet" title="No expenses this month" />
        ) : (
          <div className="space-y-3">
            {merchants.map((m) => (
              <div key={m.merchantKey}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-slate-700 dark:text-slate-100" title={m.label}>
                    {m.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-600 dark:text-slate-400">
                    {formatEuro(m.totalCents)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full progress-track" aria-hidden="true">
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
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="chart"
            title="No trend yet"
            description="Import a few months to see a trend."
          />
        ) : (
          <>
            <svg viewBox="0 0 240 80" className="h-20 w-full text-brand-600 dark:text-brand-400" aria-hidden="true">
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
            <table className="sr-only">
              <caption>Savings rate by month</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Savings rate</th>
                </tr>
              </thead>
              <tbody>
                {savingsSeries.map((p) => (
                  <tr key={p.monthKey}>
                    <th scope="row">{monthName(p.monthKey)}</th>
                    <td>{p.savingsRate === null ? "No income" : `${p.savingsRate}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1 flex justify-between gap-2 text-xs text-muted" aria-hidden="true">
              <span>{monthName(first?.monthKey)}</span>
              <span>{last?.savingsRate === null ? "—" : `${last?.savingsRate}%`}</span>
              <span>{monthName(last?.monthKey)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Latest net {formatEuroSigned(last?.netCents ?? 0)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
