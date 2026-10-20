import { startOfDay } from "@/lib/date";

export type BudgetTxRow = {
  type: string;
  amountCents: number;
  date: Date;
  categoryId?: string | null;
  deletedAt?: Date | null;
};

export type BudgetProfileRow = {
  startingBalanceCents: number;
  startingBalanceDate: Date;
};

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function centsToEuros(cents: number): number {
  return cents / 100;
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function parseAmountToCents(
  value: FormDataEntryValue | null
): number | null {
  if (value === null || String(value).trim() === "") return null;
  const normalized = String(value).trim().replace(",", ".");
  const euros = Number(normalized);
  if (isNaN(euros) || euros <= 0) return null;
  return eurosToCents(euros);
}

export function formatEuro(cents: number): string {
  return euroFormatter.format(centsToEuros(cents));
}

export function formatEuroSigned(cents: number): string {
  const prefix = cents > 0 ? "+" : cents < 0 ? "" : "";
  return `${prefix}${formatEuro(cents)}`;
}

function isActiveOnOrAfterAnchor(tx: BudgetTxRow, anchor: Date): boolean {
  if (tx.deletedAt) return false;
  return startOfDay(tx.date).getTime() >= startOfDay(anchor).getTime();
}

export function sumByType(
  transactions: BudgetTxRow[],
  type: "income" | "expense",
  options?: { from?: Date; to?: Date; anchor?: Date }
): number {
  const anchor = options?.anchor;
  const from = options?.from ? startOfDay(options.from).getTime() : null;
  const to = options?.to ? startOfDay(options.to).getTime() : null;

  return transactions.reduce((sum, tx) => {
    if (tx.deletedAt || tx.type !== type) return sum;
    if (anchor && !isActiveOnOrAfterAnchor(tx, anchor)) return sum;
    const day = startOfDay(tx.date).getTime();
    if (from !== null && day < from) return sum;
    if (to !== null && day > to) return sum;
    return sum + tx.amountCents;
  }, 0);
}

export function computeBalance(
  profile: BudgetProfileRow | null,
  transactions: BudgetTxRow[]
): number {
  const starting = profile?.startingBalanceCents ?? 0;
  const anchor = profile?.startingBalanceDate ?? new Date(0);
  const income = sumByType(transactions, "income", { anchor });
  const expenses = sumByType(transactions, "expense", { anchor });
  return starting + income - expenses;
}

export function computePeriodTotals(
  transactions: BudgetTxRow[],
  from: Date,
  to: Date
): { incomeCents: number; expenseCents: number; netCents: number } {
  const incomeCents = sumByType(transactions, "income", { from, to });
  const expenseCents = sumByType(transactions, "expense", { from, to });
  return {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
  };
}

export function computeSavingsRate(
  incomeCents: number,
  expenseCents: number
): number | null {
  if (incomeCents <= 0) return null;
  return Math.round(((incomeCents - expenseCents) / incomeCents) * 100);
}

export type CategoryBreakdown = {
  categoryId: string;
  name: string;
  totalCents: number;
};
