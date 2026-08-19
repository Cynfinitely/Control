import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { coerceDate, startOfDay, endOfDay, rangeFor, toDateInputValue } from "@/lib/date";
import type { LedgerTypeFilter } from "@/lib/budget-range";
import { ensureBudgetCategories } from "@/lib/budget-categories";
import type { BudgetCategory } from "@prisma/client";
import {
  computePeriodTotals,
  computeSavingsRate,
  type BudgetTxRow,
} from "@/lib/budget";
import {
  computeMonthOverMonth,
  expenseBreakdownWithUncategorized,
  monthKeysSpanning,
  savingsSeriesByMonth,
  topMerchantsBySpend,
} from "@/lib/budget/analysis";

type TxWithMeta = BudgetTxRow & {
  id: string;
  note: string | null;
  categoryName: string;
  merchantKey: string | null;
  rawDescription: string | null;
  importBatchId: string | null;
};

async function loadBudgetContext(userId: string) {
  await ensureBudgetCategories(userId);

  const [categories, transactions, profile] = await Promise.all([
    prisma.budgetCategory.findMany({
      where: { userId, isHidden: false },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.budgetTransaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.budgetProfile.findUnique({ where: { userId } }),
  ]);

  const txRows: TxWithMeta[] = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amountCents: tx.amountCents,
    date: tx.date,
    categoryId: tx.categoryId ?? undefined,
    deletedAt: tx.deletedAt,
    note: tx.note,
    categoryName: tx.category?.name ?? "Uncategorized",
    merchantKey: tx.merchantKey,
    rawDescription: tx.rawDescription,
    importBatchId: tx.importBatchId,
  }));

  return { categories, transactions: txRows, profile };
}

function reviveTxRow<T extends { date: Date | string; deletedAt?: Date | string | null }>(
  tx: T
): Omit<T, "date" | "deletedAt"> & { date: Date; deletedAt: Date | null } {
  return {
    ...tx,
    date: coerceDate(tx.date),
    deletedAt: tx.deletedAt ? coerceDate(tx.deletedAt) : null,
  };
}

export async function getBudgetCategories(userId: string, includeHidden = false) {
  return cachedQuery(
    ["budget-categories", userId, includeHidden ? "all" : "visible"],
    [cacheTag("budget", userId)],
    async () => {
      await ensureBudgetCategories(userId);
      return prisma.budgetCategory.findMany({
        where: includeHidden ? { userId } : { userId, isHidden: false },
        orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      });
    }
  );
}

export async function getMonthBudget(userId: string, monthStart: Date) {
  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
  const data = await cachedQuery(
    ["budget-month", userId, monthKey],
    [cacheTag("budget", userId), cacheTag("dashboard", userId)],
    async () => {
      const { from, to } = rangeFor("monthly", monthStart);
      const { categories, transactions, profile } = await loadBudgetContext(userId);
      const active = transactions.filter((tx) => !tx.deletedAt);
      const totals = computePeriodTotals(active, from, to);
      const savingsRate = computeSavingsRate(totals.incomeCents, totals.expenseCents);
      const expenseCategories = categories.filter((c) => c.kind === "expense");
      const breakdown = expenseBreakdownWithUncategorized(active, expenseCategories, from, to);

      const prevStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
      const prevRange = rangeFor("monthly", prevStart);
      const prevTotals = computePeriodTotals(active, prevRange.from, prevRange.to);
      const prevSavings = computeSavingsRate(prevTotals.incomeCents, prevTotals.expenseCents);
      const mom = computeMonthOverMonth(
        { ...totals, savingsRate },
        {
          ...prevTotals,
          savingsRate: prevSavings,
        }
      );

      const merchants = topMerchantsBySpend(active, from, to);
      const monthKeys = monthKeysSpanning(active, 12);
      const savingsSeries = savingsSeriesByMonth(active, monthKeys);
      const uncategorizedCount = active.filter((tx) => !tx.categoryId).length;
      const hasTransactions = active.length > 0;
      const fromT = startOfDay(from).getTime();
      const toT = startOfDay(to).getTime();
      const monthEntries = active
        .filter((tx) => {
          const day = startOfDay(tx.date).getTime();
          return day >= fromT && day <= toT;
        })
        .map((tx) => ({
          date: tx.date,
          type: tx.type,
          amountCents: tx.amountCents,
          categoryName: tx.categoryName,
          merchantKey: tx.merchantKey,
          rawDescription: tx.rawDescription,
          note: tx.note,
        }));

      const recentBatches = await prisma.budgetImportBatch.findMany({
        where: { userId, deletedAt: null },
        orderBy: { importedAt: "desc" },
        take: 5,
      });

      return {
        categories,
        from,
        to,
        ...totals,
        savingsRate,
        breakdown,
        mom,
        merchants,
        savingsSeries,
        uncategorizedCount,
        hasTransactions,
        monthEntries,
        setupComplete: profile?.setupComplete ?? hasTransactions,
        recentBatches,
      };
    }
  );
  return {
    ...data,
    from: coerceDate(data.from),
    to: coerceDate(data.to),
    recentBatches: data.recentBatches.map((b) => ({
      ...b,
      importedAt: coerceDate(b.importedAt),
      dateFrom: b.dateFrom ? coerceDate(b.dateFrom) : null,
      dateTo: b.dateTo ? coerceDate(b.dateTo) : null,
      deletedAt: b.deletedAt ? coerceDate(b.deletedAt) : null,
    })),
    monthEntries: (data.monthEntries ?? []).map((entry) => ({
      ...entry,
      date: coerceDate(entry.date),
    })),
  };
}

export async function getUncategorizedTransactions(userId: string, limit = 100) {
  const data = await cachedQuery(
    ["budget-uncategorized", userId],
    [cacheTag("budget", userId)],
    async () => {
      await ensureBudgetCategories(userId);
      const [entries, categories] = await Promise.all([
        prisma.budgetTransaction.findMany({
          where: { userId, deletedAt: null, categoryId: null },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: limit,
        }),
        prisma.budgetCategory.findMany({
          where: { userId, isHidden: false },
          orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        }),
      ]);

      return {
        entries: entries.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amountCents: tx.amountCents,
          date: tx.date,
          note: tx.note,
          merchantKey: tx.merchantKey,
          rawDescription: tx.rawDescription,
          categoryId: tx.categoryId,
          categoryName: "Uncategorized",
        })),
        categories,
        count: entries.length,
      };
    }
  );
  return {
    ...data,
    entries: data.entries.map(reviveTxRow),
  };
}

export async function getBudgetSummaryForDashboard(userId: string, ref: Date) {
  return cachedQuery(
    ["budget-dashboard", userId, ref.toISOString().slice(0, 10)],
    [cacheTag("budget", userId), cacheTag("dashboard", userId)],
    async () => {
      const { transactions, profile } = await loadBudgetContext(userId);
      const { from, to } = rangeFor("monthly", ref);
      const active = transactions.filter((tx) => !tx.deletedAt);
      const { netCents, incomeCents, expenseCents } = computePeriodTotals(active, from, to);
      const uncategorizedCount = active.filter((tx) => !tx.categoryId).length;
      const hasTransactions = active.length > 0;

      return {
        monthNetCents: netCents,
        monthIncomeCents: incomeCents,
        monthExpenseCents: expenseCents,
        uncategorizedCount,
        setupComplete: profile?.setupComplete ?? hasTransactions,
        hasTransactions,
      };
    }
  );
}

export async function getWeekExpenseTotal(userId: string, weekStart: Date, weekEnd: Date) {
  const { transactions } = await loadBudgetContext(userId);
  const active = transactions.filter((tx) => !tx.deletedAt);
  const { expenseCents } = computePeriodTotals(active, weekStart, weekEnd);
  return expenseCents;
}

export type RangeBudgetEntry = {
  id: string;
  type: string;
  amountCents: number;
  date: Date;
  note: string | null;
  categoryId: string | null;
  categoryName: string;
  merchantKey?: string | null;
  rawDescription?: string | null;
};

export async function getRangeBudget(
  userId: string,
  from: Date,
  to: Date,
  filters?: { type?: LedgerTypeFilter; categoryId?: string | null }
) {
  const fromKey = toDateInputValue(from);
  const toKey = toDateInputValue(to);
  const typeKey = filters?.type ?? "all";
  const categoryKey = filters?.categoryId ?? "all";

  const data = await cachedQuery(
    ["budget-range", userId, fromKey, toKey, typeKey, categoryKey],
    [cacheTag("budget", userId)],
    async () => {
      await ensureBudgetCategories(userId);

      const where = {
        userId,
        deletedAt: null,
        date: { gte: startOfDay(from), lte: endOfDay(to) },
        ...(filters?.type && filters.type !== "all" ? { type: filters.type } : {}),
        ...(filters?.categoryId === "__uncategorized__"
          ? { categoryId: null }
          : filters?.categoryId
            ? { categoryId: filters.categoryId }
            : {}),
      };

      const [entries, categories] = await Promise.all([
        prisma.budgetTransaction.findMany({
          where,
          include: { category: true },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        }),
        prisma.budgetCategory.findMany({
          where: { userId, isHidden: false },
          orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        }),
      ]);

      const txRows: RangeBudgetEntry[] = entries.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amountCents: tx.amountCents,
        date: tx.date,
        note: tx.note,
        categoryId: tx.categoryId,
        categoryName: tx.category?.name ?? "Uncategorized",
        merchantKey: tx.merchantKey,
        rawDescription: tx.rawDescription,
      }));

      const totals = computePeriodTotals(
        txRows.map((tx) => ({
          type: tx.type,
          amountCents: tx.amountCents,
          date: tx.date,
          categoryId: tx.categoryId ?? undefined,
        })),
        from,
        to
      );
      const expenseCategories = categories.filter((c) => c.kind === "expense");
      const breakdown = expenseBreakdownWithUncategorized(
        txRows.map((tx) => ({
          type: tx.type,
          amountCents: tx.amountCents,
          date: tx.date,
          categoryId: tx.categoryId ?? undefined,
        })),
        expenseCategories,
        from,
        to
      );

      return {
        entries: txRows,
        categories,
        from,
        to,
        ...totals,
        breakdown,
        transactionCount: txRows.length,
      };
    }
  );
  return {
    ...data,
    entries: data.entries.map(reviveTxRow),
    from: coerceDate(data.from),
    to: coerceDate(data.to),
  };
}

export type { BudgetCategory };
