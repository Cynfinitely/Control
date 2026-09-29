import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { addDays, coerceDate, startOfDay, endOfDay, toDateInputValue } from "@/lib/date";
import { resolveFoodSettings, type FoodSettings } from "@/lib/food/meals";
import type { FoodInsightEntry } from "@/lib/food/insights";
import { normalizeFood } from "@/lib/food/items";

export type FoodEntryView = {
  id: string;
  name: string;
  meal: string | null;
  items: string | null;
  note: string | null;
  hunger: number | null;
  eatenAt: string | null;
  createdAt: string;
  defaultMealId: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DefaultMealView = {
  id: string;
  name: string;
  meal: string | null;
  items: { id: string; name: string; quantity: string | null }[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type RecentFood = {
  name: string;
  meal: string | null;
  items: string | null;
};

export type NutritionTargetView = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const DEFAULT_NUTRITION_TARGET: NutritionTargetView = { calories: 2000, protein: 120, carbs: 220, fat: 70 };

function toIso(d: Date | string | null): string | null {
  return d ? coerceDate(d).toISOString() : null;
}

export async function getFoodSettings(userId: string): Promise<FoodSettings> {
  return cachedQuery(["food-settings", userId], [cacheTag("food", userId)], async () => {
    const row = await prisma.foodPreference.findUnique({
      where: { userId },
      select: { mode: true, mealLabels: true },
    });
    return resolveFoodSettings(row);
  });
}

export async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return user?.timezone ?? "Europe/Istanbul";
}

export async function getNutritionTarget(userId: string): Promise<NutritionTargetView> {
  const target = await prisma.nutritionTarget.findUnique({
    where: { userId },
    select: { calories: true, protein: true, carbs: true, fat: true },
  });
  return target ?? DEFAULT_NUTRITION_TARGET;
}

export async function getDayFoodEntries(userId: string, dayKey: string) {
  const day = new Date(dayKey + "T00:00:00");
  return cachedQuery(
    ["food-day", userId, dayKey],
    [cacheTag("food", userId), cacheTag("dashboard", userId)],
    async () => {
      const [rows, target, waterAgg] = await Promise.all([
        prisma.foodLogEntry.findMany({
          where: {
            userId,
            deletedAt: null,
            date: { gte: startOfDay(day), lte: endOfDay(day) },
          },
          orderBy: { createdAt: "asc" },
        }),
        prisma.nutritionTarget.findUnique({
          where: { userId },
          select: { calories: true, protein: true, carbs: true, fat: true },
        }),
        prisma.waterLog.aggregate({
          where: { userId, date: { gte: startOfDay(day), lte: endOfDay(day) } },
          _sum: { glasses: true },
        }),
      ]);
      const entries: FoodEntryView[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        meal: r.meal,
        items: r.items,
        note: r.note,
        hunger: r.hunger,
        eatenAt: toIso(r.eatenAt),
        createdAt: coerceDate(r.createdAt).toISOString(),
        defaultMealId: r.defaultMealId,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
      }));
      return {
        entries,
        target: target ?? DEFAULT_NUTRITION_TARGET,
        waterGlasses: waterAgg._sum.glasses ?? 0,
      };
    }
  );
}

export async function getDefaultMeals(userId: string): Promise<DefaultMealView[]> {
  return cachedQuery(["food-defaults", userId], [cacheTag("food", userId)], async () => {
    const rows = await prisma.defaultMeal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      meal: r.meal,
      items: r.items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
    }));
  });
}

/** Distinct recently logged meals (most recent first), excluding ones logged via a Default Meal. */
export async function getRecentFoods(userId: string, limit = 8): Promise<RecentFood[]> {
  const since = addDays(startOfDay(new Date()), -30);
  return cachedQuery(["food-recent", userId, String(limit)], [cacheTag("food", userId)], async () => {
    const rows = await prisma.foodLogEntry.findMany({
      where: { userId, deletedAt: null, defaultMealId: null, date: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { name: true, meal: true, items: true },
      take: 200,
    });
    const seen = new Set<string>();
    const recent: RecentFood[] = [];
    for (const r of rows) {
      const key = normalizeFood(r.name);
      if (seen.has(key)) continue;
      seen.add(key);
      recent.push(r);
      if (recent.length === limit) break;
    }
    return recent;
  });
}

export async function getFoodRange(userId: string, from: Date, to: Date): Promise<FoodInsightEntry[]> {
  return cachedQuery(
    ["food-range", userId, from.toISOString(), to.toISOString()],
    [cacheTag("food", userId)],
    () =>
      prisma.foodLogEntry.findMany({
        where: { userId, deletedAt: null, date: { gte: from, lte: to } },
        orderBy: { createdAt: "asc" },
        select: {
          name: true,
          meal: true,
          items: true,
          date: true,
          eatenAt: true,
          createdAt: true,
          defaultMealId: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
        },
      })
  );
}

export async function getFoodReportRange(userId: string, from: Date, to: Date) {
  const fromKey = toDateInputValue(from);
  const toKey = toDateInputValue(to);
  const data = await cachedQuery(
    ["food-report", userId, fromKey, toKey],
    [cacheTag("food", userId), cacheTag("dashboard", userId)],
    async () => {
      const [entries, target, waterLogs] = await Promise.all([
        prisma.foodLogEntry.findMany({
          where: {
            userId,
            deletedAt: null,
            date: { gte: from, lte: to },
          },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        }),
        prisma.nutritionTarget.findUnique({ where: { userId } }),
        prisma.waterLog.findMany({
          where: { userId, date: { gte: from, lte: to } },
          orderBy: { date: "asc" },
        }),
      ]);
      return { entries, target, waterLogs };
    }
  );

  return {
    entries: data.entries.map((entry) => ({
      ...entry,
      date: coerceDate(entry.date),
      meal: entry.meal ?? "",
    })),
    target: data.target,
    waterLogs: data.waterLogs.map((log) => ({ ...log, date: coerceDate(log.date) })),
  };
}
