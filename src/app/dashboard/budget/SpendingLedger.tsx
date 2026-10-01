import Link from "next/link";
import clsx from "clsx";
import {
  buildBudgetUrl,
  groupTransactionsByDay,
  type BudgetSearchParams,
  type LedgerParams,
} from "@/lib/budget-range";
import { formatEuro, formatEuroSigned } from "@/lib/budget";
import type { RangeBudgetEntry } from "@/lib/queries/budget";
import LedgerRangeNavigator from "@/components/LedgerRangeNavigator";
import SegmentedControl from "@/components/SegmentedControl";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
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

const UNCATEGORIZED = "__uncategorized__";

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
  const chipCategories = (type: string) =>
    categories.filter((c) => (type === "income" ? c.kind === "income" : c.kind === "expense"));
  const visibleCategories = chipCategories(ledger.typeFilter);
  const filtered = ledger.typeFilter !== "all" || Boolean(ledger.categoryId);
  // Category chips are per type; drop a selected category that doesn't belong to the new type.
  const categoryForType = (type: string): string | undefined => {
    const current = ledger.categoryId;
    if (!current || current === UNCATEGORIZED || type === "all") return current ?? undefined;
    return chipCategories(type).some((c) => c.id === current) ? current : undefined;
  };

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
        <StatCard size="sm" label="Income" value={formatEuro(rangeData.incomeCents)} />
        <StatCard size="sm" label="Expenses" value={formatEuro(rangeData.expenseCents)} />
        <StatCard size="sm" label="Net" value={formatEuroSigned(rangeData.netCents)} />
        <StatCard size="sm" label="Transactions" value={rangeData.transactionCount} />
      </div>

      <div className="mb-4 space-y-3">
        <SegmentedControl
          aria-label="Transaction type"
          value={ledger.typeFilter}
          options={TYPE_FILTERS.map((f) => ({
            value: f.value,
            label: f.label,
            href: buildBudgetUrl(basePath, searchParams, {
              filter: f.value,
              category: categoryForType(f.value),
            }),
          }))}
        />
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <CategoryChip
            href={buildBudgetUrl(basePath, searchParams, { category: undefined })}
            active={!ledger.categoryId}
            label="All categories"
          />
          <CategoryChip
            href={buildBudgetUrl(basePath, searchParams, { category: UNCATEGORIZED })}
            active={ledger.categoryId === UNCATEGORIZED}
            label="Uncategorized"
          />
          {visibleCategories.map((cat) => (
            <CategoryChip
              key={cat.id}
              href={buildBudgetUrl(basePath, searchParams, { category: cat.id })}
              active={ledger.categoryId === cat.id}
              label={cat.name}
            />
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          variant="inline"
          icon="wallet"
          headingLevel="h3"
          title={filtered ? "No transactions match these filters" : "No transactions in this range"}
          description={
            filtered ? `Nothing in ${ledger.label} with the current type or category.` : "Pick another range above."
          }
          actionLabel={filtered ? "Clear filters" : undefined}
          actionHref={
            filtered ? buildBudgetUrl(basePath, searchParams, { filter: "all", category: undefined }) : undefined
          }
        />
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
                  <h3 className="subsection-title">{group.dayLabel}</h3>
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      dayTotal >= 0 ? "text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <span className="sr-only">Day total </span>
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

function CategoryChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={clsx("chip", active ? "chip-active" : "chip-idle")}
    >
      {label}
    </Link>
  );
}
