import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfWeek, addDays, endOfDay } from "@/lib/date";

export async function getWeekMealPlan(userId: string, weekStartKey: string) {
  const weekStart = new Date(weekStartKey + "T00:00:00");
  const weekEnd = endOfDay(addDays(weekStart, 6));

  return cachedQuery(
    ["meal-plan", userId, weekStartKey],
    [cacheTag("food-planner", userId)],
    () =>
      prisma.mealPlanItem.findMany({
        where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
        orderBy: { createdAt: "asc" },
        include: { ingredients: true },
      })
  );
}

export function currentWeekStartKey() {
  return startOfWeek(new Date()).toISOString().slice(0, 10);
}
