import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  toDateInputValue,
  parseDayParam,
  parseMonthParam,
  toMonthKey,
  formatDate,
} from "@/lib/date";
import { periodLabel } from "@/lib/period";
import {
  getMonthBudget,
  getRangeBudget,
  getUncategorizedTransactions,
} from "@/lib/queries/budget";
import { formatEuro, formatEuroSigned } from "@/lib/budget";
import { parseLedgerParams } from "@/lib/budget-range";
import PageHeader from "@/components/PageHeader";
import MonthNavigator from "@/components/MonthNavigator";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import SpendingLedger from "./SpendingLedger";
import ImportUpload from "./ImportUpload";
import UncategorizedQueue from "./UncategorizedQueue";
import BudgetAnalysisExtras from "./BudgetAnalysisExtras";
import ResetBudgetPanel from "./ResetBudgetPanel";
import { undoImportBatchForm } from "./actions";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: {
    day?: string;
    month?: string;
    ledger?: string;
    from?: string;
    to?: string;
    filter?: string;
    category?: string;
    view?: string;
  };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const monthStart = parseMonthParam(searchParams.month, day);
  const monthKey = toMonthKey(monthStart);
  const monthLabel = periodLabel("monthly", monthKey);
  const showQueue = searchParams.view === "uncategorized";

  const ledger = parseLedgerParams(searchParams);
  const ledgerFromValue = toDateInputValue(ledger.from);
  const ledgerToValue = toDateInputValue(ledger.to);

  const [monthData, rangeData, uncategorized] = await Promise.all([
    getMonthBudget(user.id, monthStart),
    getRangeBudget(user.id, ledger.from, ledger.to, {
      type: ledger.typeFilter,
      categoryId: ledger.categoryId,
    }),
    getUncategorizedTransactions(user.id),
  ]);

  const maxBreakdown = monthData.breakdown[0]?.totalCents ?? 1;
  const empty = !monthData.hasTransactions;

  return (
    <div>
      <PageHeader
        title="Budget"
        description="Import Nordea statements, categorize merchants, and review monthly spending."
        action={
          <div className="flex flex-wrap gap-2">
            {monthData.uncategorizedCount > 0 && (
              <Link
                href={`/dashboard/budget?month=${monthKey}&view=uncategorized`}
                className="btn-ghost touch-target text-amber-700"
              >
                Uncategorized ({monthData.uncategorizedCount})
              </Link>
            )}
            <Link href="/dashboard/budget/categories" className="btn-ghost touch-target">
              Categories →
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <ImportUpload empty={empty} />
      </div>

      {monthData.recentBatches.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-3">Recent imports</h2>
          <ul className="space-y-2 text-sm">
            {monthData.recentBatches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-700">
                  <span className="font-medium">{batch.filename}</span>
                  <span className="text-slate-400">
                    {" "}
                    · {batch.rowCount} rows · {formatDate(batch.importedAt)}
                    {batch.skippedDuplicates > 0
                      ? ` · ${batch.skippedDuplicates} duplicates skipped`
                      : ""}
                  </span>
                </span>
                <FormAction action={undoImportBatchForm} successMessage="Import undone">
                  <input type="hidden" name="batchId" value={batch.id} />
                  <SubmitButton className="btn-ghost touch-target text-red-600" pendingLabel="Undoing…">
                    Undo
                  </SubmitButton>
                </FormAction>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showQueue ? (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-title">Uncategorized queue</h2>
            <Link href={`/dashboard/budget?month=${monthKey}`} className="btn-ghost touch-target">
              ← Back to analysis
            </Link>
          </div>
          <UncategorizedQueue entries={uncategorized.entries} categories={uncategorized.categories} />
        </section>
      ) : (
        <>
          <section className="mb-8">
            <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
              <MonthNavigator
                basePath="/dashboard/budget"
                monthKey={monthKey}
                monthLabel={monthLabel}
                dayValue={dayValue}
              />
            </div>

            {empty ? (
              <p className="text-sm text-slate-400">
                No transactions yet. Import a Nordea file to see analysis for this month.
              </p>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="card">
                    <p className="text-sm text-slate-500">Income</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">
                      {formatEuro(monthData.incomeCents)}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-slate-500">Expenses</p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                      {formatEuro(monthData.expenseCents)}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-slate-500">Net</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatEuroSigned(monthData.netCents)}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-slate-500">Savings rate</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {monthData.savingsRate === null ? "—" : `${monthData.savingsRate}%`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {monthData.savingsRate === null ? "No income this month" : "of income saved"}
                    </p>
                  </div>
                </div>

                <BudgetAnalysisExtras
                  mom={monthData.mom}
                  merchants={monthData.merchants}
                  savingsSeries={monthData.savingsSeries}
                />

                {monthData.breakdown.length > 0 && (
                  <div className="card mb-4">
                    <h2 className="section-title mb-3">Spending by category</h2>
                    <div className="space-y-3">
                      {monthData.breakdown.map((row) => (
                        <div key={row.categoryId}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{row.name}</span>
                            <span className="text-slate-600">{formatEuro(row.totalCents)}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-brand-500"
                              style={{
                                width: `${Math.round((row.totalCents / maxBreakdown) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {!empty && (
            <SpendingLedger
              searchParams={searchParams}
              ledger={ledger}
              rangeData={rangeData}
              categories={rangeData.categories}
              dayValue={dayValue}
              monthKey={monthKey}
              refDay={day}
              fromValue={ledgerFromValue}
              toValue={ledgerToValue}
            />
          )}
        </>
      )}

      <ResetBudgetPanel />
    </div>
  );
}
