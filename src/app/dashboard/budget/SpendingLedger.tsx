import Link from "next/link";
import {
  buildBudgetUrl,
  groupTransactionsByDay,
  type BudgetSearchParams,
  type LedgerParams,
} from "@/lib/budget-range";
import { formatEuro, formatEuroSigned } from "@/lib/budget";
import type { RangeBudgetEntry } from "@/lib/queries/budget";
import Icon from "@/components/Icon";
import LedgerRangeNavigator from "@/components/LedgerRangeNavigator";
import SubmitIconButton from "@/components/SubmitIconButton";
import { deleteTransaction } from "./actions";

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
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">
                          {e.note || e.categoryName}
                        </p>
                        <p className="text-xs text-slate-400">{e.categoryName}</p>
                      </div>
                      <p
                        className={`shrink-0 font-semibold ${
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
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
