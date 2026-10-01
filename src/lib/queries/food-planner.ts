import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { startOfWeek, addDays, coerceDate, endOfDay, toDateInputValue } from "@/lib/date";

/** Monday (YYYY-MM-DD) of the week containing `value`; falls back to the current week. */
export function weekStartKeyFromParam(value: string | undefined): string {
  const parsed = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T00:00:00") : new Date();
  const ref = isNaN(parsed.getTime()) ? new Date() : parsed;
  return toDateInputValue(startOfWeek(ref));
}

export async function getWeekMealPlan(userId: string, weekStartKey: string) {
  const weekStart = new Date(weekStartKey + "T00:00:00");
  const weekEnd = endOfDay(addDays(weekStart, 6));

  const items = await cachedQuery(
    ["meal-plan", userId, weekStartKey],
    [cacheTag("food-planner", userId)],
    () =>
      prisma.mealPlanItem.findMany({
        where: { userId, deletedAt: null, date: { gte: weekStart, lte: weekEnd } },
        orderBy: { createdAt: "asc" },
        include: { ingredients: { orderBy: { createdAt: "asc" } } },
      })
  );

  // Cached values are JSON round-tripped: revive dates after the await.
  return items.map((item) => ({
    ...item,
    date: coerceDate(item.date),
    createdAt: coerceDate(item.createdAt),
    loggedAt: item.loggedAt ? coerceDate(item.loggedAt) : null,
    deletedAt: item.deletedAt ? coerceDate(item.deletedAt) : null,
    ingredients: item.ingredients.map((g) => ({ ...g, createdAt: coerceDate(g.createdAt) })),
  }));
}

export function currentWeekStartKey() {
  return toDateInputValue(startOfWeek(new Date()));
}
