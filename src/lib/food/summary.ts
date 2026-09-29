import { addDays, coerceDate, startOfDay, toDateInputValue } from "@/lib/date";
import type { FoodPromptDay, FoodPromptEntry, FoodPromptTargets } from "@/lib/food/prompt";

export const DEFAULT_NUTRITION_TARGETS: FoodPromptTargets = {
  calories: 2000,
  protein: 120,
  carbs: 220,
  fat: 70,
};

export type FoodRangeEntry = {
  id: string;
  date: Date | string;
  name: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodRangeWater = {
  date: Date | string;
  glasses: number;
};

export type FoodDaySummary = FoodPromptDay & {
  dayKey: string;
  overCalories: boolean;
  underProtein: boolean;
  entries: FoodPromptEntry[];
};

export type FoodRangeSummary = {
  days: FoodDaySummary[];
  dayCount: number;
  loggedDays: number;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterGlasses: number;
  };
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

function average(total: number, days: number): number {
  if (days <= 0) return 0;
  return total / days;
}

export function summarizeFoodRange(
  entries: FoodRangeEntry[],
  waterLogs: FoodRangeWater[],
  from: Date,
  to: Date,
  targets: FoodPromptTargets
): FoodRangeSummary {
  const byDay = new Map<string, FoodRangeEntry[]>();
  for (const entry of entries) {
    const key = toDateInputValue(entry.date);
    const list = byDay.get(key) ?? [];
    list.push(entry);
    byDay.set(key, list);
  }

  const waterByDay = new Map<string, number>();
  for (const log of waterLogs) {
    const key = toDateInputValue(log.date);
    waterByDay.set(key, (waterByDay.get(key) ?? 0) + log.glasses);
  }

  const days: FoodDaySummary[] = [];
  let cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor.getTime() <= end.getTime()) {
    const dayKey = toDateInputValue(cursor);
    const dayEntries = byDay.get(dayKey) ?? [];
    const calories = dayEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const protein = dayEntries.reduce((sum, entry) => sum + entry.protein, 0);
    const carbs = dayEntries.reduce((sum, entry) => sum + entry.carbs, 0);
    const fat = dayEntries.reduce((sum, entry) => sum + entry.fat, 0);
    const logged = dayEntries.length > 0;
    days.push({
      dayKey,
      date: new Date(cursor),
      calories,
      protein,
      carbs,
      fat,
      waterGlasses: waterByDay.get(dayKey) ?? 0,
      logged,
      overCalories: logged && calories > targets.calories,
      underProtein: logged && protein < targets.protein,
      entries: dayEntries.map((entry) => ({
        date: coerceDate(entry.date),
        name: entry.name,
        meal: entry.meal,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      })),
    });
    cursor = startOfDay(addDays(cursor, 1));
  }

  const loggedDays = days.filter((day) => day.logged);
  const totals = {
    calories: days.reduce((sum, day) => sum + day.calories, 0),
    protein: days.reduce((sum, day) => sum + day.protein, 0),
    carbs: days.reduce((sum, day) => sum + day.carbs, 0),
    fat: days.reduce((sum, day) => sum + day.fat, 0),
    waterGlasses: days.reduce((sum, day) => sum + day.waterGlasses, 0),
  };

  return {
    days,
    dayCount: days.length,
    loggedDays: loggedDays.length,
    totals,
    averages: {
      calories: average(totals.calories, loggedDays.length),
      protein: average(totals.protein, loggedDays.length),
      carbs: average(totals.carbs, loggedDays.length),
      fat: average(totals.fat, loggedDays.length),
    },
  };
}
