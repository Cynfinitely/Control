import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay, rangeFor } from "@/lib/date";
import { ensureBudgetCategories } from "@/lib/budget-categories";
import {
  computeBalance,
  computePeriodTotals,
  computeSavingsRate,
  expenseBreakdownByCategory,
  type BudgetTxRow,
} from "@/lib/budget";

async function loadBudgetContext(userId: string) {
  await ensureBudgetCategories(userId);

  const [profile, categories, transactions] = await Promise.all([
    prisma.budgetProfile.findUnique({ where: { userId } }),
    prisma.budgetCategory.findMany({
      where: { userId, isHidden: false },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.budgetTransaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const txRows: (BudgetTxRow & { id: string; note: string | null; categoryName: string })[] =
    transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amountCents: tx.amountCents,
      date: tx.date,
      categoryId: tx.categoryId,
      deletedAt: tx.deletedAt,
      note: tx.note,
      categoryName: tx.category.name,
    }));

  return { profile, categories, transactions: txRows };
}

export async function getBudgetProfile(userId: string) {
  return cachedQuery(
    ["budget-profile", userId],
    [cacheTag("budget", userId)],
    async () => {
      await ensureBudgetCategories(userId);
      return prisma.budgetProfile.findUnique({ where: { userId } });
    }
  );
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

export async function getDayBudget(userId: string, dayKey: string) {
  return cachedQuery(
    ["budget-day", userId, dayKey],
    [cacheTag("budget", userId), cacheTag("dashboard", userId)],
    async () => {
      const day = new Date(dayKey + "T00:00:00");
      const { profile, categories, transactions } = await loadBudgetContext(userId);

      const dayEntries = transactions.filter((tx) => {
        if (tx.deletedAt) return false;
        const t = startOfDay(tx.date).getTime();
        return t >= startOfDay(day).getTime() && t <= endOfDay(day).getTime();
      });

      return {
        profile,
        categories,
        entries: dayEntries,
        balanceCents: computeBalance(profile, transactions),
      };
    }
  );
}

export async function getMonthBudget(userId: string, monthStart: Date) {
  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
  return cachedQuery(
    ["budget-month", userId, monthKey],
    [cacheTag("budget", userId), cacheTag("dashboard", userId)],
    async () => {
      const { from, to } = rangeFor("monthly", monthStart);
      const { profile, categories, transactions } = await loadBudgetContext(userId);
      const active = transactions.filter((tx) => !tx.deletedAt);
      const totals = computePeriodTotals(active, from, to);
      const balanceCents = computeBalance(profile, transactions);
      const savingsRate = computeSavingsRate(totals.incomeCents, totals.expenseCents);
      const expenseCategories = categories.filter((c) => c.kind === "expense");
      const breakdown = expenseBreakdownByCategory(active, expenseCategories, from, to);

      return {
        profile,
        categories,
        from,
        to,
        balanceCents,
        ...totals,
        savingsRate,
        breakdown,
      };
    }
  );
}

export async function getBudgetSummaryForDashboard(userId: string, ref: Date) {
  return cachedQuery(
    ["budget-dashboard", userId, ref.toISOString().slice(0, 10)],
    [cacheTag("budget", userId), cacheTag("dashboard", userId)],
    async () => {
      const { profile, transactions } = await loadBudgetContext(userId);
      const { from, to } = rangeFor("monthly", ref);
      const active = transactions.filter((tx) => !tx.deletedAt);
      const balanceCents = computeBalance(profile, transactions);
      const { netCents } = computePeriodTotals(active, from, to);

      return { balanceCents, monthNetCents: netCents, setupComplete: profile?.setupComplete ?? false };
    }
  );
}

export async function getWeekExpenseTotal(userId: string, weekStart: Date, weekEnd: Date) {
  const { transactions } = await loadBudgetContext(userId);
  const active = transactions.filter((tx) => !tx.deletedAt);
  const { expenseCents } = computePeriodTotals(active, weekStart, weekEnd);
  return expenseCents;
}
