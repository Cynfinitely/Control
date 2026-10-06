import { requireModule } from "@/lib/session";
import { toDateInputValue, parseDayParam, parseMonthParam, toMonthKey, formatDate } from "@/lib/date";
import { periodLabel } from "@/lib/period";
import {
  getMonthBudget,
  getRangeBudget,
  getUncategorizedTransactions,
} from "@/lib/queries/budget";
import { formatEuro, formatEuroSigned } from "@/lib/budget";
import { parseLedgerParams } from "@/lib/budget-range";
import { buildMonthBudgetPrompt } from "@/lib/budget/prompt";
import PageHeader from "@/components/PageHeader";
import MonthNavigator from "@/components/MonthNavigator";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import FocusTarget from "@/components/FocusTarget";
import SegmentedControl from "@/components/SegmentedControl";
import SpendingLedger from "./SpendingLedger";
import ImportUpload from "./ImportUpload";
import UncategorizedQueue from "./UncategorizedQueue";
import BudgetAnalysisExtras from "./BudgetAnalysisExtras";
import BudgetAiPromptButton from "./BudgetAiPromptButton";
import ResetBudgetPanel from "./ResetBudgetPanel";
import BudgetNav from "./BudgetNav";
import { undoImportBatchForm } from "./actions";

export const metadata = { title: "Budget" };

type SearchParams = {
  day?: string;
  month?: string;
  ledger?: string;
  from?: string;
  to?: string;
  filter?: string;
  category?: string;
  view?: string;
  focus?: string;
};

const HEADER_DESCRIPTION = "Import Nordea statements, categorize merchants, and review monthly spending.";

export default async function BudgetPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireModule("budget");
  const day = parseDayParam(searchParams.day);
  const monthParam = searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month) ? searchParams.month : undefined;

  if (searchParams.view === "uncategorized") {
    return <UncategorizedView userId={user.id} monthParam={monthParam} day={day} />;
  }

  const dayValue = toDateInputValue(day);
  const monthStart = parseMonthParam(searchParams.month, day);
  const monthKey = toMonthKey(monthStart);
  const monthLabel = periodLabel("monthly", monthKey);

  const ledger = parseLedgerParams(searchParams);
  const ledgerFromValue = toDateInputValue(ledger.from);
  const ledgerToValue = toDateInputValue(ledger.to);

  const [monthData, rangeData] = await Promise.all([
    getMonthBudget(user.id, monthStart),
    getRangeBudget(user.id, ledger.from, ledger.to, {
      type: ledger.typeFilter,
      categoryId: ledger.categoryId,
    }),
  ]);

  const maxBreakdown = monthData.breakdown[0]?.totalCents ?? 1;
  const empty = !monthData.hasTransactions;
  const monthHasEntries = monthData.monthEntries.length > 0;
  const monthUncategorizedCount = monthData.monthEntries.filter(
    (entry) => entry.categoryName === "Uncategorized"
  ).length;
  const aiPrompt = monthHasEntries
    ? buildMonthBudgetPrompt({
        monthLabel,
        monthKey,
        incomeCents: monthData.incomeCents,
        expenseCents: monthData.expenseCents,
        netCents: monthData.netCents,
        savingsRate: monthData.savingsRate,
        mom: monthData.mom,
        breakdown: monthData.breakdown,
        merchants: monthData.merchants,
        uncategorizedCount: monthUncategorizedCount,
        entries: monthData.monthEntries,
      })
    : "";

  return (
    <div>
      <PageHeader help="budget:overview" title="Budget" description={HEADER_DESCRIPTION}>
        <BudgetNav active="overview" uncategorizedCount={monthData.uncategorizedCount} monthParam={monthParam} />
      </PageHeader>

      {/* Same position in both states so the import summary survives the first import. */}
      <div className="mb-6">
        <FocusTarget value="import">
          <ImportUpload empty={empty} />
        </FocusTarget>
      </div>

      {!empty && (
        <>
          <section className="mb-8" aria-labelledby="budget-month-heading">
            <h2 id="budget-month-heading" className="sr-only">
              {monthLabel} overview
            </h2>
            <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
              <MonthNavigator
                basePath="/dashboard/budget"
                monthKey={monthKey}
                monthLabel={monthLabel}
                dayValue={dayValue}
              />
              {monthHasEntries && (
                <BudgetAiPromptButton
                  monthLabel={monthLabel}
                  prompt={aiPrompt}
                  uncategorizedCount={monthUncategorizedCount}
                />
              )}
            </div>

            {!monthHasEntries ? (
              <EmptyState
                variant="inline"
                headingLevel="h3"
                icon="calendar"
                title={`No transactions in ${monthLabel}`}
                description="Pick another month, or import a statement that covers it."
              />
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  <StatCard label="Income" value={formatEuro(monthData.incomeCents)} />
                  <StatCard label="Expenses" value={formatEuro(monthData.expenseCents)} />
                  <StatCard
                    label="Net"
                    value={formatEuroSigned(monthData.netCents)}
                    tone={monthData.netCents < 0 ? "bad" : "default"}
                    status={monthData.netCents < 0 ? "Spent more than earned" : undefined}
                  />
                  <StatCard
                    label="Savings rate"
                    value={monthData.savingsRate === null ? "—" : `${monthData.savingsRate}%`}
                    hint={monthData.savingsRate === null ? "No income this month" : "of income saved"}
                  />
                </div>

                <BudgetAnalysisExtras
                  mom={monthData.mom}
                  merchants={monthData.merchants}
                  savingsSeries={monthData.savingsSeries}
                />

                {monthData.breakdown.length > 0 && (
                  <div className="card mb-4">
                    <h2 className="section-title mb-3">Spending by category</h2>
                    <ul className="space-y-3">
                      {monthData.breakdown.map((row) => (
                        <li key={row.categoryId}>
                          <div className="mb-1 flex justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-100">
                              {row.name}
                            </span>
                            <span className="shrink-0 tabular-nums text-slate-600 dark:text-slate-400">
                              {formatEuro(row.totalCents)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full progress-track" aria-hidden="true">
                            <div
                              className="h-full bg-brand-500"
                              style={{ width: `${Math.round((row.totalCents / maxBreakdown) * 100)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="budget-ledger-heading">
            <h2 id="budget-ledger-heading" className="section-title mb-3">
              Transactions
            </h2>
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
          </section>

          <section className="mt-10 space-y-4" aria-labelledby="budget-imports-heading">
            <h2 id="budget-imports-heading" className="section-title">
              Imports &amp; data
            </h2>
            {monthData.recentBatches.length > 0 && (
              <div className="card-flush">
                <h3 className="subsection-title border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  Recent imports
                </h3>
                <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
                  {monthData.recentBatches.map((batch) => (
                    <li key={batch.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="break-all font-medium text-slate-800 dark:text-slate-100">{batch.filename}</p>
                        <p className="text-xs text-muted">
                          {batch.rowCount} rows · imported {formatDate(batch.importedAt)}
                          {batch.skippedDuplicates > 0 ? ` · ${batch.skippedDuplicates} duplicates skipped` : ""}
                        </p>
                      </div>
                      <FormAction
                        action={undoImportBatchForm}
                        successMessage="Import undone"
                        confirm={{
                          title: `Undo import of “${batch.filename}”?`,
                          message: `This removes the ${batch.rowCount} ${
                            batch.rowCount === 1 ? "transaction" : "transactions"
                          } imported on ${formatDate(batch.importedAt)}. You can import the file again later.`,
                          confirmLabel: "Undo import",
                        }}
                      >
                        <input type="hidden" name="batchId" value={batch.id} />
                        <SubmitButton className="btn-danger btn-sm min-h-[40px]" pendingLabel="Undoing…">
                          Undo import
                        </SubmitButton>
                      </FormAction>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ResetBudgetPanel />
          </section>
        </>
      )}
    </div>
  );
}

async function UncategorizedView({
  userId,
  monthParam,
  day,
}: {
  userId: string;
  monthParam: string | undefined;
  day: Date;
}) {
  const queue = await getUncategorizedTransactions(userId, { monthKey: monthParam });
  const allTotal = queue.allTotal;
  const toggleMonth = monthParam ?? toMonthKey(day);
  const toggleLabel = periodLabel("monthly", toggleMonth);

  return (
    <div>
      <PageHeader help="budget:uncategorized" title="Budget" description={HEADER_DESCRIPTION}>
        <BudgetNav active="uncategorized" uncategorizedCount={allTotal} monthParam={monthParam} />
      </PageHeader>

      <section aria-labelledby="uncategorized-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id="uncategorized-heading" className="section-title">
              Uncategorized transactions
            </h2>
            <p className="mt-1 text-sm text-muted">
              Pick a category once per merchant. It applies to the merchant's other rows and to future imports.
            </p>
          </div>
          {allTotal > 0 && (
            <SegmentedControl
              aria-label="Which months"
              size="sm"
              value={monthParam ? "month" : "all"}
              options={[
                {
                  value: "month",
                  label: toggleLabel,
                  href: `/dashboard/budget?view=uncategorized&month=${toggleMonth}`,
                },
                { value: "all", label: `All months (${allTotal})`, href: "/dashboard/budget?view=uncategorized" },
              ]}
            />
          )}
        </div>

        {queue.entries.length === 0 ? (
          allTotal > 0 ? (
            <EmptyState
              icon="check"
              title={`Nothing to categorize in ${toggleLabel}`}
              description={`${allTotal} ${allTotal === 1 ? "transaction" : "transactions"} in other months still need a category.`}
              actionLabel="Show all months"
              actionHref="/dashboard/budget?view=uncategorized"
            />
          ) : (
            <EmptyState
              icon="check"
              title="Everything is categorized"
              description="New imports show up here when a merchant has no category yet."
              actionLabel="Back to overview"
              actionHref={monthParam ? `/dashboard/budget?month=${monthParam}` : "/dashboard/budget"}
            />
          )
        ) : (
          <UncategorizedQueue entries={queue.entries} categories={queue.categories} total={queue.total} />
        )}
      </section>
    </div>
  );
}
