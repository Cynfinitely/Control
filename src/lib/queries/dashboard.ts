import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfDay, endOfDay } from "@/lib/date";
import { getPeriodKey } from "@/lib/period";

export async function getDashboardStats(userId: string, todayKey: string) {
  const now = new Date(todayKey + "T12:00:00");
  const from = startOfDay(now);
  const to = endOfDay(now);
  const weekKey = getPeriodKey("weekly", now);

  return cachedQuery(
    ["dashboard-stats", userId, todayKey],
    [cacheTag("dashboard", userId)],
    async () => {
      const [
        todayOpenTodos,
        todayDoneTodos,
        weeklyGoals,
        caloriesAgg,
        target,
        workoutsToday,
        prayersToday,
        pendingQaza,
        pendingFollowUps,
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
          where: { userId, status: "done", deletedAt: null, dayDate: { gte: from, lte: to } },
        }),
        prisma.goal.count({
          where: { userId, status: "active", deletedAt: null, period: "weekly", periodKey: weekKey },
        }),
        prisma.foodLogEntry.aggregate({
          where: { userId, deletedAt: null, date: { gte: from, lte: to } },
          _sum: { calories: true },
        }),
        prisma.nutritionTarget.findUnique({ where: { userId } }),
        prisma.workout.count({
          where: { userId, deletedAt: null, date: { gte: from, lte: to } },
        }),
        prisma.prayerLog.findMany({
          where: { userId, date: { gte: from, lte: to } },
          select: { status: true },
        }),
        prisma.qazaPrayer.count({ where: { userId, fulfilledAt: null } }),
        prisma.followUp.count({ where: { userId, done: false } }),
      ]);

      return {
        todayOpenTodos,
        todayDoneTodos,
        weeklyGoals,
        caloriesToday: caloriesAgg._sum.calories ?? 0,
        calorieTarget: target?.calories ?? 2000,
        workoutsToday,
        prayersOnTime: prayersToday.filter((p) => p.status === "ontime").length,
        pendingQaza,
        pendingFollowUps,
      };
    }
  );
}
