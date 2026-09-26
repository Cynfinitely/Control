import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay, startOfWeek, addDays, coerceDate, toDateInputValue } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";
import { historicalDebtRemaining } from "@/lib/prayer-debt";
import { getBudgetSummaryForDashboard } from "@/lib/queries/budget";
import { summarizeDayPrayers } from "@/lib/religious/day-prayers";
import { countOverdueContacts, networkingHealth } from "@/lib/networking";

export type DomainHealth = "good" | "warn" | "bad";

export async function getDashboardStats(userId: string, todayKey: string) {
  const day = new Date(todayKey + "T00:00:00");
  const from = startOfDay(day);
  const to = endOfDay(day);
  const weekStart = startOfWeek(day);
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const weekKey = getPeriodKey("weekly", day);
  const certExpirySoon = addDays(day, 30);

  return cachedQuery(
    ["dashboard-stats", "v4", userId, todayKey],
    [cacheTag("dashboard", userId), cacheTag("plan", userId), cacheTag("religious", userId), cacheTag("todos", userId), cacheTag("networking", userId)],
    async () => {
      const [
        todayOpenTodos,
        todayDoneTodos,
        overdueTodos,
        weeklyGoals,
        weeklyGoalsCompleted,
        mealsToday,
        foodDatesThisWeek,
        workoutsToday,
        workoutsThisWeek,
        prayersToday,
        prayersThisWeek,
        pendingQazaDaily,
        prayerDebts,
        contactTouches,
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
        prisma.foodLogEntry.count({
          where: { userId, deletedAt: null, date: { gte: from, lte: to } },
        }),
        prisma.foodLogEntry.findMany({
          where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
          select: { date: true },
        }),
        prisma.workout.count({
          where: { userId, deletedAt: null, date: { gte: from, lte: to } },
        }),
        prisma.workout.count({
          where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
        }),
        prisma.prayerLog.findMany({
          where: { userId, date: { gte: from, lte: to } },
          select: { prayer: true, status: true },
        }),
        prisma.prayerLog.findMany({
          where: { userId, date: { gte: weekStart, lte: weekEnd } },
          select: { prayer: true, status: true },
        }),
        prisma.qazaPrayer.count({ where: { userId, fulfilledAt: null } }),
        prisma.prayerDebt.findMany({ where: { userId } }),
        prisma.contact.findMany({
          where: { userId, deletedAt: null },
          select: {
            touchCadenceDays: true,
            interactions: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          },
        }),
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
        getBudgetSummaryForDashboard(userId, day),
        prisma.planBlock.count({
          where: { userId, deletedAt: null, planDate: { gte: from, lte: to } },
        }),
        prisma.planBlock.count({
          where: { userId, deletedAt: null, status: "done", planDate: { gte: from, lte: to } },
        }),
      ]);

      const foodDaysThisWeek = new Set(foodDatesThisWeek.map((f) => toDateInputValue(coerceDate(f.date)))).size;
      const todayPrayers = summarizeDayPrayers(prayersToday);
      const prayersOnTimeToday = todayPrayers.onTime;
      const prayersOnTimeWeek = prayersThisWeek.filter((p) => p.status === "ontime").length;
      const prayersLoggedWeek = prayersThisWeek.length;
      const weeklyPrayerRate =
        prayersLoggedWeek > 0 ? Math.round((prayersOnTimeWeek / prayersLoggedWeek) * 100) : 0;

      const historicalRemaining = historicalDebtRemaining(prayerDebts);
      const pendingQaza = pendingQazaDaily + historicalRemaining;

      const overdueContacts = countOverdueContacts(
        contactTouches.map((c) => ({
          lastTouch: c.interactions[0] ? coerceDate(c.interactions[0].date) : null,
          touchCadenceDays: c.touchCadenceDays,
        })),
        day
      );

      const health = {
        todos:
          overdueTodos > 0 ? ("bad" as DomainHealth) : todayOpenTodos === 0 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        goals: weeklyGoals === 0 ? ("warn" as DomainHealth) : weeklyGoalsCompleted > 0 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        food: mealsToday > 0 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        exercise: workoutsThisWeek >= 3 ? ("good" as DomainHealth) : workoutsThisWeek > 0 ? ("warn" as DomainHealth) : ("bad" as DomainHealth),
        religious:
          pendingQaza > 5
            ? ("bad" as DomainHealth)
            : todayPrayers.missed > 0
              ? ("warn" as DomainHealth)
              : prayersOnTimeToday >= 4
                ? ("good" as DomainHealth)
                : ("warn" as DomainHealth),
        career: (learningHoursWeek._sum.hours ?? 0) >= 2 ? ("good" as DomainHealth) : ("warn" as DomainHealth),
        networking: networkingHealth(overdueContacts),
        budget:
          !budgetSummary.setupComplete
            ? ("warn" as DomainHealth)
            : budgetSummary.uncategorizedCount > 0
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
        mealsToday,
        foodDaysThisWeek,
        workoutsToday,
        workoutsThisWeek,
        prayersOnTime: prayersOnTimeToday,
        prayersMissed: todayPrayers.missed,
        prayersUnlogged: todayPrayers.unlogged,
        weeklyPrayerRate,
        pendingQaza,
        overdueContacts,
        careerGoalsActive,
        learningHoursWeek: learningHoursWeek._sum.hours ?? 0,
        expiringCerts,
        waterGlasses: waterToday._sum.glasses ?? 0,
        budgetMonthNetCents: budgetSummary.monthNetCents,
        budgetUncategorizedCount: budgetSummary.uncategorizedCount,
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
