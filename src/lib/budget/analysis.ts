import { startOfDay } from "@/lib/date";
import {
  computePeriodTotals,
  computeSavingsRate,
  type BudgetTxRow,
  type CategoryBreakdown,
} from "@/lib/budget";

export type MerchantSpend = {
  merchantKey: string;
  label: string;
  totalCents: number;
  count: number;
};

export type MonthSavingsPoint = {
  monthKey: string; // YYYY-MM
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  savingsRate: number | null;
};

export type MonthOverMonth = {
  incomeDeltaCents: number;
  expenseDeltaCents: number;
  netDeltaCents: number;
  savingsRateDelta: number | null;
};

const UNCATEGORIZED_ID = "__uncategorized__";

export function expenseBreakdownWithUncategorized(
  transactions: BudgetTxRow[],
  categories: { id: string; name: string }[],
  from: Date,
  to: Date
): CategoryBreakdown[] {
  const totals = new Map<string, number>();
  let uncategorized = 0;
  const fromT = startOfDay(from).getTime();
  const toT = startOfDay(to).getTime();

  for (const tx of transactions) {
    if (tx.deletedAt || tx.type !== "expense") continue;
    const day = startOfDay(tx.date).getTime();
    if (day < fromT || day > toT) continue;
    if (!tx.categoryId) {
      uncategorized += tx.amountCents;
      continue;
    }
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amountCents);
  }

  const rows: CategoryBreakdown[] = categories
    .map((cat) => ({
      categoryId: cat.id,
      name: cat.name,
      totalCents: totals.get(cat.id) ?? 0,
    }))
    .filter((row) => row.totalCents > 0);

  if (uncategorized > 0) {
    rows.push({
      categoryId: UNCATEGORIZED_ID,
      name: "Uncategorized",
      totalCents: uncategorized,
    });
  }

  return rows.sort((a, b) => b.totalCents - a.totalCents);
}

export function topMerchantsBySpend(
  transactions: Array<BudgetTxRow & { merchantKey?: string | null; rawDescription?: string | null; note?: string | null }>,
  from: Date,
  to: Date,
  limit = 8
): MerchantSpend[] {
  const fromT = startOfDay(from).getTime();
  const toT = startOfDay(to).getTime();
  const map = new Map<string, MerchantSpend>();

  for (const tx of transactions) {
    if (tx.deletedAt || tx.type !== "expense") continue;
    const day = startOfDay(tx.date).getTime();
    if (day < fromT || day > toT) continue;
    const key = (tx.merchantKey || "").trim() || "UNKNOWN";
    const label = (tx.rawDescription || tx.note || key).trim() || key;
    const existing = map.get(key);
    if (existing) {
      existing.totalCents += tx.amountCents;
      existing.count += 1;
    } else {
      map.set(key, { merchantKey: key, label, totalCents: tx.amountCents, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.totalCents - a.totalCents).slice(0, limit);
}

export function savingsSeriesByMonth(
  transactions: BudgetTxRow[],
  monthKeys: string[]
): MonthSavingsPoint[] {
  return monthKeys.map((monthKey) => {
    const [y, m] = monthKey.split("-").map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);
    const totals = computePeriodTotals(transactions, from, to);
    return {
      monthKey,
      ...totals,
      savingsRate: computeSavingsRate(totals.incomeCents, totals.expenseCents),
    };
  });
}

export function computeMonthOverMonth(
  current: { incomeCents: number; expenseCents: number; netCents: number; savingsRate: number | null },
  previous: { incomeCents: number; expenseCents: number; netCents: number; savingsRate: number | null } | null
): MonthOverMonth | null {
  if (!previous) return null;
  const savingsRateDelta =
    current.savingsRate === null || previous.savingsRate === null
      ? null
      : current.savingsRate - previous.savingsRate;
  return {
    incomeDeltaCents: current.incomeCents - previous.incomeCents,
    expenseDeltaCents: current.expenseCents - previous.expenseCents,
    netDeltaCents: current.netCents - previous.netCents,
    savingsRateDelta,
  };
}

export function monthKeysSpanning(transactions: BudgetTxRow[], maxMonths = 12): string[] {
  const active = transactions.filter((tx) => !tx.deletedAt);
  if (active.length === 0) return [];

  let min = Infinity;
  let max = -Infinity;
  for (const tx of active) {
    const t = startOfDay(tx.date).getTime();
    if (t < min) min = t;
    if (t > max) max = t;
  }

  const keys: string[] = [];
  const cursor = new Date(min);
  cursor.setDate(1);
  const end = new Date(max);
  end.setDate(1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys.slice(-maxMonths);
}
