import {
  addDays,
  endOfDay,
  formatDate,
  formatDayLabel,
  parseDayParam,
  parseMonthParam,
  rangeFor,
  startOfDay,
  toDateInputValue,
  toMonthKey,
} from "@/lib/date";
import { periodLabel } from "@/lib/period";

export type LedgerPeriod = "week" | "month" | "custom";
export type LedgerTypeFilter = "all" | "income" | "expense";

export type LedgerParams = {
  period: LedgerPeriod;
  from: Date;
  to: Date;
  label: string;
  typeFilter: LedgerTypeFilter;
  categoryId: string | null;
};

export type BudgetSearchParams = {
  day?: string;
  month?: string;
  ledger?: string;
  from?: string;
  to?: string;
  filter?: string;
  category?: string;
};

const VALID_PERIODS = new Set<LedgerPeriod>(["week", "month", "custom"]);
const VALID_FILTERS = new Set<LedgerTypeFilter>(["all", "income", "expense"]);

export function parseLedgerParams(searchParams: BudgetSearchParams): LedgerParams {
  const period: LedgerPeriod = VALID_PERIODS.has(searchParams.ledger as LedgerPeriod)
    ? (searchParams.ledger as LedgerPeriod)
    : "month";

  const refDay = parseDayParam(searchParams.day);
  const typeFilter: LedgerTypeFilter = VALID_FILTERS.has(searchParams.filter as LedgerTypeFilter)
    ? (searchParams.filter as LedgerTypeFilter)
    : "all";
  const categoryId = searchParams.category?.trim() || null;

  if (period === "week") {
    const { from, to } = rangeFor("weekly", refDay);
    return {
      period,
      from,
      to,
      label: `${formatDate(from)} – ${formatDate(to)}`,
      typeFilter,
      categoryId,
    };
  }

  if (period === "custom") {
    let from = startOfDay(parseDayParam(searchParams.from ?? searchParams.day));
    let to = endOfDay(parseDayParam(searchParams.to ?? searchParams.day));
    if (from.getTime() > to.getTime()) {
      [from, to] = [startOfDay(to), endOfDay(from)];
    }
    return {
      period,
      from,
      to,
      label: `${formatDate(from)} – ${formatDate(to)}`,
      typeFilter,
      categoryId,
    };
  }

  const monthStart = parseMonthParam(searchParams.month, refDay);
  const { from, to } = rangeFor("monthly", monthStart);
  return {
    period,
    from,
    to,
    label: periodLabel("monthly", toMonthKey(monthStart)),
    typeFilter,
    categoryId,
  };
}

export function groupTransactionsByDay<
  T extends { date: Date | string },
>(entries: T[]): { dayKey: string; dayLabel: string; entries: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const entry of entries) {
    const dayKey = toDateInputValue(entry.date);
    const list = groups.get(dayKey) ?? [];
    list.push(entry);
    groups.set(dayKey, list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayEntries]) => ({
      dayKey,
      dayLabel: formatDayLabel(new Date(dayKey + "T00:00:00")),
      entries: dayEntries,
    }));
}

export function buildBudgetUrl(
  basePath: string,
  params: BudgetSearchParams,
  updates: Partial<BudgetSearchParams> = {}
): string {
  const merged = { ...params, ...updates };
  const qs = new URLSearchParams();

  if (merged.month) qs.set("month", merged.month);
  if (merged.day && merged.day !== toDateInputValue(new Date())) qs.set("day", merged.day);
  if (merged.ledger && merged.ledger !== "month") qs.set("ledger", merged.ledger);
  if (merged.from) qs.set("from", merged.from);
  if (merged.to) qs.set("to", merged.to);
  if (merged.filter && merged.filter !== "all") qs.set("filter", merged.filter);
  if (merged.category) qs.set("category", merged.category);

  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function shiftLedgerPeriod(
  period: LedgerPeriod,
  offset: number,
  refDay: Date,
  monthKey: string
): Partial<BudgetSearchParams> {
  if (period === "week") {
    const nextDay = toDateInputValue(addDays(refDay, offset * 7));
    return { day: nextDay, ledger: "week" };
  }
  if (period === "custom") {
    return {};
  }
  const [year, month] = monthKey.split("-").map(Number);
  const ref = new Date(year, month - 1 + offset, 1);
  return { month: toMonthKey(ref), ledger: "month" };
}
