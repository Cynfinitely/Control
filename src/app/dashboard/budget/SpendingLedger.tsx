import Link from "next/link";
import {
  buildBudgetUrl,
  groupTransactionsByDay,
  type BudgetSearchParams,
  type LedgerParams,
} from "@/lib/budget-range";
import { formatEuro, formatEuroSigned } from "@/lib/budget";
import type { RangeBudgetEntry } from "@/lib/queries/budget";
import LedgerRangeNavigator from "@/components/LedgerRangeNavigator";
import BudgetTransactionRow from "./BudgetTransactionRow";

type Category = { id: string; name: string; kind: string };

type RangeData = {
  entries: RangeBudgetEntry[];
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  transactionCount: number;
};

type Props = {
  searchParams: BudgetSearchParams;
  ledger: LedgerParams;
  rangeData: RangeData;
  categories: Category[];
  dayValue: string;
  monthKey: string;
  refDay: Date;
  fromValue: string;
  toValue: string;
};

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
] as const;

export default function SpendingLedger({
  searchParams,
  ledger,
  rangeData,
  categories,
  dayValue,
  monthKey,
  refDay,
  fromValue,
  toValue,
}: Props) {
  const basePath = "/dashboard/budget";
  const groups = groupTransactionsByDay(rangeData.entries);
  const expenseCategories = categories.filter((c) => c.kind === "expense");

  return (
    <section className="mb-8">
      <div className="card mb-4">
        <LedgerRangeNavigator
          basePath={basePath}
          searchParams={searchParams}
          period={ledger.period}
          label={ledger.label}
          fromValue={fromValue}
          toValue={toValue}
          refDay={refDay}
          monthKey={monthKey}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card py-3">
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">
            {formatEuro(rangeData.incomeCents)}
          </p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-slate-500">Expenses</p>
          <p className="mt-1 text-lg font-bold text-red-600">
            {formatEuro(rangeData.expenseCents)}
          </p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-slate-500">Net</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatEuroSigned(rangeData.netCents)}
          </p>
        </div>
        <div className="card py-3">
          <p className="text-xs text-slate-500">Transactions</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{rangeData.transactionCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildBudgetUrl(basePath, searchParams, { filter: f.value })}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              ledger.typeFilter === f.value
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
        {expenseCategories.length > 0 && (
          <span className="mx-1 self-center text-slate-300">|</span>
        )}
        <Link
          href={buildBudgetUrl(basePath, searchParams, { category: undefined })}
          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
            !ledger.categoryId
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All categories
        </Link>
        {expenseCategories.map((cat) => (
          <Link
            key={cat.id}
            href={buildBudgetUrl(basePath, searchParams, { category: cat.id })}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              ledger.categoryId === cat.id
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-400">
          No transactions in this range
          {ledger.typeFilter !== "all" || ledger.categoryId ? " with the current filters" : ""}.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const dayTotal = group.entries.reduce(
              (sum, e) => sum + (e.type === "income" ? e.amountCents : -e.amountCents),
              0
            );
            return (
              <div key={group.dayKey}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">{group.dayLabel}</h3>
                  <span
                    className={`text-xs font-medium ${
                      dayTotal >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatEuroSigned(dayTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.entries.map((e) => (
                    <BudgetTransactionRow key={e.id} entry={e} categories={categories} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
