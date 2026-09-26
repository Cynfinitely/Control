import { prisma } from "@/lib/db";
import { rangeFor } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";
import { historicalDebtRemaining } from "@/lib/prayer-debt";
import { computePeriodTotals, computeSavingsRate, formatEuro, formatEuroSigned } from "@/lib/budget";
import { weeklyFoodSummary } from "@/lib/food/insights";

export type Period = "daily" | "weekly" | "monthly";

export type ReportStat = {
  label: string;
  value: string | number;
  href?: string;
};

export async function buildReport(userId: string, period: Period) {
  const { from, to } = rangeFor(period);
  const weekKey = getPeriodKey("weekly", from);

  const [
    todosCompleted,
    todosCreated,
    backlogCount,
    overdueTodos,
    activeGoalsInPeriod,
    completedGoals,
    foodEntries,
    target,
    workouts,
    weights,
    prayers,
    qazaFulfilled,
    qazaPendingDaily,
    prayerDebts,
    dhikr,
    quran,
    quranState,
    fasts,
    learning,
    careerGoalsCompleted,
    skillsCount,
    interactions,
    calls,
    waterGlasses,
    budgetTransactions,
    user,
  ] = await Promise.all([
    prisma.todo.count({ where: { userId, completedAt: { gte: from, lte: to } } }),
    prisma.todo.count({ where: { userId, createdAt: { gte: from, lte: to }, deletedAt: null } }),
    prisma.todo.count({ where: { userId, inBacklog: true, status: "open", deletedAt: null } }),
    prisma.todo.count({
      where: { userId, deletedAt: null, status: "open", dueDate: { lt: new Date() } },
    }),
    prisma.goal.count({
      where: { userId, status: "active", deletedAt: null, period: "weekly", periodKey: weekKey },
    }),
    prisma.goal.count({
      where: { userId, status: "completed", updatedAt: { gte: from, lte: to } },
    }),
    prisma.foodLogEntry.findMany({ where: { userId, deletedAt: null, date: { gte: from, lte: to } } }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
    prisma.workout.findMany({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
      include: { exercises: { include: { sets: true } } },
    }),
    prisma.bodyWeightLog.findMany({ where: { userId, date: { gte: from, lte: to } }, orderBy: { date: "asc" } }),
    prisma.prayerLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.qazaPrayer.count({
      where: { userId, fulfilledAt: { gte: from, lte: to } },
    }),
    prisma.qazaPrayer.count({ where: { userId, fulfilledAt: null } }),
    prisma.prayerDebt.findMany({ where: { userId } }),
    prisma.dhikrLog.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.quranProgress.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.quranState.findUnique({ where: { userId } }),
    prisma.fastingLog.count({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.learningEntry.findMany({ where: { userId, deletedAt: null, date: { gte: from, lte: to } } }),
    prisma.careerGoal.count({
      where: { userId, status: "completed", deletedAt: null, updatedAt: { gte: from, lte: to } },
    }),
    prisma.skill.count({ where: { userId, deletedAt: null, createdAt: { gte: from, lte: to } } }),
    prisma.interaction.count({ where: { userId, date: { gte: from, lte: to } } }),
    prisma.interaction.count({ where: { userId, type: "call", date: { gte: from, lte: to } } }),
    prisma.waterLog.aggregate({
      where: { userId, date: { gte: from, lte: to } },
      _sum: { glasses: true },
    }),
    prisma.budgetTransaction.findMany({
      where: { userId, deletedAt: null, date: { gte: from, lte: to } },
      include: { category: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);

  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const food = weeklyFoodSummary(foodEntries, { timeZone: user?.timezone ?? "Europe/Istanbul", daysInPeriod: days });
  const nutritionStats: ReportStat[] = food.nutrition
    ? [
        {
          label: "Avg calories/day",
          value: Math.round(food.nutrition.calories / food.nutrition.daysWithData),
          href: "/dashboard/food/week",
        },
        {
          label: "Avg protein/day",
          value: `${Math.round(food.nutrition.protein / food.nutrition.daysWithData)}g`,
          href: "/dashboard/food/week",
        },
        ...(target ? [{ label: "Calorie target", value: Math.round(target.calories), href: "/dashboard/food/settings" }] : []),
      ]
    : [];

  const qazaPending = qazaPendingDaily + historicalDebtRemaining(prayerDebts);

  const gymWorkouts = workouts.filter((w) => w.activityType === "gym");
  const walkWorkouts = workouts.filter((w) => w.activityType === "walk");
  const cardioWorkouts = workouts.filter((w) => w.activityType !== "gym");
  const totalSets = gymWorkouts.reduce(
    (s, w) => s + w.exercises.reduce((a, e) => a + e.sets.length, 0),
    0
  );
  const totalCardioMin = cardioWorkouts.reduce((s, w) => s + (w.durationMin ?? 0), 0);

  const prayersOnTime = prayers.filter((p) => p.status === "ontime").length;
  const prayersMissed = prayers.filter((p) => p.status === "missed").length;
  const prayersLogged = prayers.length;
  const prayerOnTimeRate = prayersLogged ? Math.round((prayersOnTime / prayersLogged) * 100) : 0;
  const dhikrTotal = dhikr.reduce((s, d) => s + d.count, 0);
  const quranPages = quran.reduce((s, q) => s + q.pagesRead, 0);
  const learningHours = learning.reduce((s, l) => s + l.hours, 0);

  const weightDelta =
    weights.length >= 2 ? weights[weights.length - 1].weightKg - weights[0].weightKg : null;

  const budgetRows = budgetTransactions.map((tx) => ({
    type: tx.type,
    amountCents: tx.amountCents,
    date: tx.date,
    categoryId: tx.categoryId,
    deletedAt: tx.deletedAt,
  }));
  const budgetTotals = computePeriodTotals(budgetRows, from, to);
  const budgetSavingsRate = computeSavingsRate(budgetTotals.incomeCents, budgetTotals.expenseCents);
  const expenseByCategory = new Map<string, { name: string; total: number }>();
  for (const tx of budgetTransactions) {
    if (tx.type !== "expense") continue;
    const key = tx.categoryId ?? "__uncategorized__";
    const name = tx.category?.name ?? "Uncategorized";
    const existing = expenseByCategory.get(key);
    if (existing) {
      existing.total += tx.amountCents;
    } else {
      expenseByCategory.set(key, { name, total: tx.amountCents });
    }
  }
  const topExpenseCategory = [...expenseByCategory.values()].sort((a, b) => b.total - a.total)[0];

  return {
    period,
    from,
    to,
    sections: [
      {
        title: "Productivity",
        stats: [
          { label: "Todos completed", value: todosCompleted, href: "/dashboard/todos" },
          { label: "Todos created", value: todosCreated, href: "/dashboard/todos" },
          { label: "In backlog", value: backlogCount, href: "/dashboard/todos" },
          { label: "Overdue", value: overdueTodos, href: "/dashboard/todos" },
        ],
      },
      {
        title: "Goals",
        stats: [
          { label: "Active (this week)", value: activeGoalsInPeriod, href: "/dashboard/goals" },
          { label: "Completed this period", value: completedGoals, href: "/dashboard/goals" },
        ],
      },
      {
        title: "Food",
        stats: [
          { label: "Days logged", value: `${food.daysLogged}/${days}`, href: "/dashboard/food/week" },
          { label: "Meals logged", value: food.totalMeals, href: "/dashboard/food/week" },
          { label: "Snack days", value: food.snackDays, href: "/dashboard/food/week" },
          { label: "Default Meal uses", value: food.defaultMealUses, href: "/dashboard/food/meals" },
          { label: "Water (glasses)", value: waterGlasses._sum.glasses ?? 0, href: "/dashboard/food" },
          ...nutritionStats,
        ],
      },
      {
        title: "Fitness",
        stats: [
          { label: "Workouts", value: workouts.length, href: "/dashboard/exercise" },
          { label: "Gym sessions", value: gymWorkouts.length, href: "/dashboard/exercise" },
          { label: "Walks", value: walkWorkouts.length, href: "/dashboard/exercise" },
          { label: "Cardio (min)", value: totalCardioMin, href: "/dashboard/exercise" },
          { label: "Gym sets", value: totalSets, href: "/dashboard/exercise" },
          {
            label: "Weight change",
            value: weightDelta === null ? "-" : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`,
            href: "/dashboard/exercise",
          },
        ],
      },
      {
        title: "Religious",
        stats: [
          { label: "Prayers on time", value: prayersOnTime, href: "/dashboard/religious" },
          { label: "Prayers missed", value: prayersMissed, href: "/dashboard/religious" },
          { label: "On-time rate", value: `${prayerOnTimeRate}%`, href: "/dashboard/religious" },
          { label: "Qaza fulfilled", value: qazaFulfilled, href: "/dashboard/religious" },
          { label: "Qaza pending", value: qazaPending, href: "/dashboard/religious" },
          { label: "Dhikr total", value: dhikrTotal, href: "/dashboard/religious" },
          { label: "Quran pages", value: quranPages, href: "/dashboard/religious" },
          {
            label: "Quran page",
            value: `${quranState?.currentPage ?? 1}/604`,
            href: "/dashboard/religious",
          },
          { label: "Khatms", value: quranState?.khatmsCompleted ?? 0, href: "/dashboard/religious" },
          { label: "Fasting days", value: fasts, href: "/dashboard/religious" },
        ],
      },
      {
        title: "Career",
        stats: [
          { label: "Learning entries", value: learning.length, href: "/dashboard/career" },
          { label: "Learning hours", value: Math.round(learningHours), href: "/dashboard/career" },
          { label: "Goals completed", value: careerGoalsCompleted, href: "/dashboard/career" },
          { label: "Skills added", value: skillsCount, href: "/dashboard/career" },
        ],
      },
      {
        title: "Networking",
        stats: [
          { label: "Interactions", value: interactions, href: "/dashboard/networking" },
          { label: "Calls", value: calls, href: "/dashboard/networking" },
        ],
      },
      {
        title: "Budget",
        stats: [
          { label: "Income", value: formatEuro(budgetTotals.incomeCents), href: "/dashboard/budget" },
          { label: "Expenses", value: formatEuro(budgetTotals.expenseCents), href: "/dashboard/budget" },
          { label: "Net", value: formatEuroSigned(budgetTotals.netCents), href: "/dashboard/budget" },
          {
            label: "Savings rate",
            value: budgetSavingsRate === null ? "-" : `${budgetSavingsRate}%`,
            href: "/dashboard/budget",
          },
          {
            label: "Top spending",
            value: topExpenseCategory ? topExpenseCategory.name : "-",
            href: "/dashboard/budget",
          },
          { label: "Transactions", value: budgetTransactions.length, href: "/dashboard/budget" },
        ],
      },
    ],
  };
}
