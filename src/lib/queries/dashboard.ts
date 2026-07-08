import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay, startOfWeek, addDays } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";
import { historicalDebtRemaining } from "@/lib/prayer-debt";
import { getBudgetSummaryForDashboard } from "@/lib/queries/budget";

export type DomainHealth = "good" | "warn" | "bad";

export async function getDashboardStats(userId: string, todayKey: string) {
  const now = new Date(todayKey + "T12:00:00");
  const from = startOfDay(now);
  const to = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const weekKey = getPeriodKey("weekly", now);
  const certExpirySoon = addDays(now, 30);

  return cachedQuery(
    ["dashboard-stats", userId, todayKey],
    [cacheTag("dashboard", userId), cacheTag("plan", userId)],
    async () => {
      const [
        todayOpenTodos,
        todayDoneTodos,
        overdueTodos,
        weeklyGoals,
        weeklyGoalsCompleted,
        caloriesAgg,
        target,
        workoutsToday,
        workoutsThisWeek,
        prayersToday,
        prayersThisWeek,
        pendingQazaDaily,
        prayerDebts,
        pendingFollowUps,
        careerGoalsActive,
        learningHoursWeek,
        expiringCerts,
        waterToday,
        budgetSummary,
        planBlocksToday,
        planBlocksDoneToday,
      ] = await Promise.all([
        prisma.todo.count({
          where: {
            userId,
            status: "open",
            deletedAt: null,
            inBacklog: false,
            dayDate: { gte: from, lte: to },
          },
        }),
        prisma.todo.count({
          where: {
            userId,
            status: "done",
            deletedAt: null,
            inBacklog: false,
            dayDate: { gte: from, lte: to },
          },
        }),
        prisma.todo.count({
          where: {
            userId,
            deletedAt: null,
            status: "open",
            dueDate: { lt: from },
          },
        }),
        prisma.goal.count({
          where: { userId, status: "active", deletedAt: null, period: "weekly", periodKey: weekKey },
        }),
        prisma.goal.count({
          where: { userId, status: "completed", deletedAt: null, period: "weekly", periodKey: weekKey },
        }),
        prisma.foodLogEntry.aggregate({
          where: { userId, deletedAt: null, date: { gte: from, lte: to } },
          _sum: { calories: true },
        }),
        prisma.nutritionTarget.findUnique({ where: { userId } }),
        prisma.workout.count({
          where: { userId, deletedAt: null, date: { gte: from, lte: to } },
        }),
        prisma.workout.count({
          where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
        }),
        prisma.prayerLog.findMany({
          where: { userId, date: { gte: from, lte: to } },
          select: { status: true },
        }),
        prisma.prayerLog.findMany({
          where: { userId, date: { gte: weekStart, lte: weekEnd } },
          select: { status: true },
        }),
        prisma.qazaPrayer.count({ where: { userId, fulfilledAt: null } }),
        prisma.prayerDebt.findMany({ where: { userId } }),
        prisma.followUp.count({ where: { userId, done: false } }),
        prisma.careerGoal.count({ where: { userId, status: "active", deletedAt: null } }),
        prisma.learningEntry.aggregate({
          where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
          _sum: { hours: true },
        }),
        prisma.certification.count({
          where: {
            userId,
            deletedAt: null,
            expiresAt: { gte: from, lte: certExpirySoon },
          },
        }),
        prisma.waterLog.aggregate({
          where: { userId, date: { gte: from, lte: to } },
          _sum: { glasses: true },
        }),
        getBudgetSummaryForDashboard(userId, now),
        prisma.planBlock.count({
          where: { userId, deletedAt: null, planDate: { gte: from, lte: to } },
        }),
        prisma.planBlock.count({
          where: { userId, deletedAt: null, status: "done", planDate: { gte: from, lte: to } },
        }),
      ]);

      const calorieTarget = target?.calories ?? 2000;
      const caloriesToday = caloriesAgg._sum.calories ?? 0;
      const prayersOnTimeToday = prayersToday.filter((p) => p.status === "ontime").length;
      const prayersOnTimeWeek = prayersThisWeek.filter((p) => p.status === "ontime").length;
      const prayersLoggedWeek = prayersThisWeek.length;
      const weeklyPrayerRate =
        prayersLoggedWeek > 0 ? Math.round((prayersOnTimeWeek / prayersLoggedWeek) * 100) : 0;

      const historicalRemaining = historicalDebtRemaining(prayerDebts);
      const pendingQaza = pendingQazaDaily + historicalRemaining;

      const health = {
        todos:
          overdueTodos > 0 ? ("bad" as DomainHealth) : todayOpenTodos === 0 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        goals: weeklyGoals === 0 ? ("warn" as DomainHealth) : weeklyGoalsCompleted > 0 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        food:
          caloriesToday === 0
            ? ("warn" as DomainHealth)
            : caloriesToday <= calorieTarget * 1.1
              ? ("good" as DomainHealth)
              : ("bad" as DomainHealth),
        exercise: workoutsThisWeek >= 3 ? ("good" as DomainHealth) : workoutsThisWeek > 0 ? ("warn" as DomainHealth) : ("bad" as DomainHealth),
        religious:
          pendingQaza > 5
            ? ("bad" as DomainHealth)
            : prayersOnTimeToday >= 4
              ? ("good" as DomainHealth)
              : ("warn" as DomainHealth),
        career: (learningHoursWeek._sum.hours ?? 0) >= 2 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        networking: pendingFollowUps > 5 ? ("bad" as DomainHealth) : pendingFollowUps === 0 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        budget:
          !budgetSummary.setupComplete
            ? ("warn" as DomainHealth)
            : budgetSummary.monthNetCents >= 0
              ? ("good" as DomainHealth)
              : ("bad" as DomainHealth),
      };

      return {
        todayOpenTodos,
        todayDoneTodos,
        overdueTodos,
        weeklyGoals,
        weeklyGoalsCompleted,
        caloriesToday,
        calorieTarget,
        workoutsToday,
        workoutsThisWeek,
        prayersOnTime: prayersOnTimeToday,
        weeklyPrayerRate,
        pendingQaza,
        pendingFollowUps,
        careerGoalsActive,
        learningHoursWeek: learningHoursWeek._sum.hours ?? 0,
        expiringCerts,
        waterGlasses: waterToday._sum.glasses ?? 0,
        budgetBalanceCents: budgetSummary.balanceCents,
        budgetMonthNetCents: budgetSummary.monthNetCents,
        budgetSetupComplete: budgetSummary.setupComplete,
        planBlocksToday,
        planBlocksDoneToday,
        planCompletionPct:
          planBlocksToday === 0 ? 0 : Math.round((planBlocksDoneToday / planBlocksToday) * 100),
        health,
      };
    }
  );
}
