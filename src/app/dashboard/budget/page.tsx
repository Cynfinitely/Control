import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  toDateInputValue,
  formatDayLabel,
  formatDate,
  parseDayParam,
  parseMonthParam,
  toMonthKey,
} from "@/lib/date";
import { periodLabel } from "@/lib/period";
import { getDayBudget, getMonthBudget, getRangeBudget } from "@/lib/queries/budget";
import { formatEuro, formatEuroSigned, centsToEuros } from "@/lib/budget";
import { parseLedgerParams } from "@/lib/budget-range";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import DayNavigator from "@/components/DayNavigator";
import MonthNavigator from "@/components/MonthNavigator";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import BudgetTransactionForm from "./BudgetTransactionForm";
import SpendingLedger from "./SpendingLedger";
import { logTransactionForm, deleteTransaction, saveStartingBalance } from "./actions";

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
  };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const monthStart = parseMonthParam(searchParams.month, day);
  const monthKey = toMonthKey(monthStart);
  const monthLabel = periodLabel("monthly", monthKey);

  const ledger = parseLedgerParams(searchParams);
  const ledgerFromValue = toDateInputValue(ledger.from);
  const ledgerToValue = toDateInputValue(ledger.to);

  const [dayData, monthData, rangeData] = await Promise.all([
    getDayBudget(user.id, dayValue),
    getMonthBudget(user.id, monthStart),
    getRangeBudget(user.id, ledger.from, ledger.to, {
      type: ledger.typeFilter,
      categoryId: ledger.categoryId,
    }),
  ]);

  const { profile, categories, entries, balanceCents } = dayData;
  const needsSetup = !profile?.setupComplete;
  const maxBreakdown = monthData.breakdown[0]?.totalCents ?? 1;

  return (
    <div>
      <PageHeader
        title="Budget"
        description="Track income, expenses, and your current balance in euros."
        action={
          <Link href="/dashboard/budget/categories" className="btn-ghost touch-target">
            Categories →
          </Link>
        }
      />

      {needsSetup && (
        <form action={saveStartingBalance} className="card mb-6 border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-900">Set your starting balance</h2>
          <p className="mt-1 text-sm text-amber-800">
            Enter how much money you had on a given date. Your balance will update as you log
            income and expenses.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Starting balance (€)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="label">As of date</label>
              <input
                name="date"
                type="date"
                className="input"
                defaultValue={dayValue}
                required
              />
            </div>
            <div className="flex items-end">
              <SubmitButton className="btn-primary touch-target w-full">Save</SubmitButton>
            </div>
          </div>
        </form>
      )}

      <section className="mb-8">
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
          <MonthNavigator
            basePath="/dashboard/budget"
            monthKey={monthKey}
            monthLabel={monthLabel}
            dayValue={dayValue}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-slate-500">Current balance</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatEuro(balanceCents)}</p>
            {profile?.startingBalanceDate && (
              <p className="text-xs text-slate-400">
                from {formatDate(profile.startingBalanceDate)}
              </p>
            )}
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Income this month</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {formatEuro(monthData.incomeCents)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Expenses this month</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatEuro(monthData.expenseCents)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Net / savings rate</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatEuroSigned(monthData.netCents)}
            </p>
            <p className="text-xs text-slate-400">
              {monthData.savingsRate === null
                ? "No income logged"
                : `${monthData.savingsRate}% saved`}
            </p>
          </div>
        </div>

        {monthData.breakdown.length > 0 && (
          <div className="card">
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
                      style={{ width: `${Math.round((row.totalCents / maxBreakdown) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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

      <section>
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
          <DayNavigator
            basePath="/dashboard/budget"
            dayValue={dayValue}
            dayLabel={dayLabel}
            monthKey={monthKey}
          />
        </div>

        <BudgetTransactionForm
          categories={categories}
          dayValue={dayValue}
          action={logTransactionForm}
        />

        <h2 className="section-title mb-3">{dayLabel}&apos;s transactions</h2>
        <div className="space-y-2">
          {entries.length === 0 && (
            <p className="text-sm text-slate-400">No transactions logged for this day.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="card flex items-center gap-3 py-3">
              <span
                className={`badge capitalize ${
                  e.type === "income"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {e.type}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">
                  {e.note || e.categoryName}
                </p>
                <p className="text-xs text-slate-400">{e.categoryName}</p>
              </div>
              <p
                className={`font-semibold ${
                  e.type === "income" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {e.type === "income" ? "+" : "−"}
                {formatEuro(e.amountCents)}
              </p>
              <form action={deleteTransaction}>
                <input type="hidden" name="id" value={e.id} />
                <SubmitIconButton
                  className="touch-target text-slate-300 hover:text-red-500"
                  title="Delete"
                  icon={<Icon name="trash" className="h-4 w-4" />}
                />
              </form>
            </div>
          ))}
        </div>
      </section>

      {!needsSetup && (
        <details className="card mt-8">
          <summary className="cursor-pointer font-medium text-slate-700">Starting balance</summary>
          <form action={saveStartingBalance} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Balance (€)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="input"
                defaultValue={centsToEuros(profile?.startingBalanceCents ?? 0)}
                required
              />
            </div>
            <div>
              <label className="label">As of date</label>
              <input
                name="date"
                type="date"
                className="input"
                defaultValue={toDateInputValue(profile?.startingBalanceDate ?? new Date())}
                required
              />
            </div>
            <div className="flex items-end">
              <SubmitButton className="btn-primary touch-target">Update</SubmitButton>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}
