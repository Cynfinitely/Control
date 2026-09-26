import { DateTime } from "luxon";
import { coerceDate, toDateInputValue } from "@/lib/date";
import { normalizeFood, splitItems } from "./items";
import { displayMealLabel, hasNutrition, isSnack } from "./meals";

export type FoodInsightEntry = {
  name: string;
  meal: string | null;
  items: string | null;
  date: Date | string;
  eatenAt: Date | string | null;
  createdAt?: Date | string;
  defaultMealId: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type CountedLabel = { label: string; count: number; days: number };

export type TimeWindow = { fromMin: number; toMin: number };

export type WeeklyFoodSummary = {
  daysInPeriod: number;
  daysLogged: number;
  totalMeals: number;
  topMeals: CountedLabel[];
  topFoods: CountedLabel[];
  snackCount: number;
  snackDays: number;
  lateSnackDays: number;
  firstMealWindow: TimeWindow | null;
  defaultMealUses: number;
  topDefaultMeals: CountedLabel[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number; daysWithData: number } | null;
};

export const LATE_EATING_MIN = 20 * 60;
const TOP_LIMIT = 5;

export function minutesInZone(d: Date | string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(coerceDate(d));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "HH:MM" of an instant in the given zone. */
export function timeInZone(d: Date | string, timeZone: string): string {
  return formatMinutes(minutesInZone(d, timeZone));
}

/** Instant for a wall-clock day ("YYYY-MM-DD") and time ("HH:MM") in the given zone. */
export function instantFromLocal(day: string, time: string, timeZone: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const dt = DateTime.fromISO(`${day}T${time}`, { zone: timeZone });
  return dt.isValid ? dt.toJSDate() : null;
}

function dayKey(d: Date | string): string {
  return toDateInputValue(coerceDate(d));
}

type Tally = { label: string; count: number; days: Set<string> };

function tally(map: Map<string, Tally>, key: string, label: string, day: string) {
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
    existing.days.add(day);
  } else {
    map.set(key, { label, count: 1, days: new Set([day]) });
  }
}

function topOf(map: Map<string, Tally>, limit = TOP_LIMIT): CountedLabel[] {
  return [...map.values()]
    .map((t) => ({ label: t.label, count: t.count, days: t.days.size }))
    .sort((a, b) => b.count - a.count || b.days - a.days || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx]!;
}

function roundTo(min: number, step: number, mode: "floor" | "ceil"): number {
  return mode === "floor" ? Math.floor(min / step) * step : Math.ceil(min / step) * step;
}

export function weeklyFoodSummary(
  entries: FoodInsightEntry[],
  opts: { timeZone: string; daysInPeriod?: number; defaultMealNames?: Map<string, string> }
): WeeklyFoodSummary {
  const days = new Set<string>();
  const meals = new Map<string, Tally>();
  const foods = new Map<string, Tally>();
  const defaults = new Map<string, Tally>();
  const snackDays = new Set<string>();
  const lateSnackDays = new Set<string>();
  const firstMealByDay = new Map<string, number>();
  const nutritionDays = new Set<string>();
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  let snackCount = 0;
  let defaultMealUses = 0;

  for (const entry of entries) {
    const day = dayKey(entry.date);
    days.add(day);
    tally(meals, normalizeFood(entry.name), entry.name, day);
    for (const item of splitItems(entry.items)) {
      tally(foods, normalizeFood(item), item, day);
    }

    const minutes = entry.eatenAt ? minutesInZone(entry.eatenAt, opts.timeZone) : null;
    if (minutes !== null) {
      const prev = firstMealByDay.get(day);
      if (prev === undefined || minutes < prev) firstMealByDay.set(day, minutes);
    }

    if (isSnack(entry.meal)) {
      snackCount += 1;
      snackDays.add(day);
      if (minutes !== null && minutes >= LATE_EATING_MIN) lateSnackDays.add(day);
    }

    if (entry.defaultMealId) {
      defaultMealUses += 1;
      const name = opts.defaultMealNames?.get(entry.defaultMealId) ?? entry.name;
      tally(defaults, entry.defaultMealId, name, day);
    }

    if (hasNutrition(entry)) {
      nutritionDays.add(day);
      totals.calories += entry.calories;
      totals.protein += entry.protein;
      totals.carbs += entry.carbs;
      totals.fat += entry.fat;
    }
  }

  const firstTimes = [...firstMealByDay.values()].sort((a, b) => a - b);
  const firstMealWindow =
    firstTimes.length === 0
      ? null
      : {
          fromMin: roundTo(percentile(firstTimes, 0.25), 15, "floor"),
          toMin: roundTo(percentile(firstTimes, 0.75), 15, "ceil"),
        };

  return {
    daysInPeriod: opts.daysInPeriod ?? 7,
    daysLogged: days.size,
    totalMeals: entries.length,
    topMeals: topOf(meals),
    topFoods: topOf(foods, 8),
    snackCount,
    snackDays: snackDays.size,
    lateSnackDays: lateSnackDays.size,
    firstMealWindow,
    defaultMealUses,
    topDefaultMeals: topOf(defaults),
    nutrition: nutritionDays.size > 0 ? { ...totals, daysWithData: nutritionDays.size } : null,
  };
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Neutral, non-judgmental sentences describing the period. */
export function weeklyObservations(summary: WeeklyFoodSummary, periodLabel = "this week"): string[] {
  if (summary.totalMeals === 0) return [];
  const out: string[] = [];

  out.push(`You logged food on ${summary.daysLogged} of ${summary.daysInPeriod} days.`);

  const w = summary.firstMealWindow;
  if (w) {
    out.push(
      w.fromMin === w.toMin
        ? `Your first meal was usually around ${formatMinutes(w.fromMin)}.`
        : `Your first meal was usually between ${formatMinutes(w.fromMin)}–${formatMinutes(w.toMin)}.`
    );
  }

  if (summary.lateSnackDays > 0) {
    out.push(`You had snacks after ${formatMinutes(LATE_EATING_MIN)} on ${plural(summary.lateSnackDays, "day")}.`);
  } else if (summary.snackDays > 0) {
    out.push(`You had snacks on ${plural(summary.snackDays, "day")}.`);
  }

  const topDefault = summary.topDefaultMeals[0];
  const topMeal = summary.topMeals[0];
  if (topDefault && topDefault.count >= 2) {
    out.push(`You ate your ${topDefault.label} ${plural(topDefault.count, "time")} ${periodLabel}.`);
  } else if (topMeal && topMeal.count >= 2) {
    out.push(`You logged ${topMeal.label} ${plural(topMeal.count, "time")} ${periodLabel}.`);
  }

  const topFood = summary.topFoods[0];
  if (topFood && topFood.count >= 3) {
    out.push(`You logged ${topFood.label.toLowerCase()} on ${plural(topFood.count, "occasion")}.`);
  }
  const byDays = summary.topFoods.filter((f) => f !== topFood && f.days >= 3).sort((a, b) => b.days - a.days)[0];
  if (byDays) {
    out.push(`You ate ${byDays.label.toLowerCase()} on ${plural(byDays.days, "day")}.`);
  }

  return out;
}

export type RepeatedMealCandidate = {
  name: string;
  count: number;
  items: string | null;
  meal: string | null;
};

/** Meal names logged repeatedly that are not yet saved as Default Meals. */
export function repeatedMealCandidates(
  entries: FoodInsightEntry[],
  defaultNames: string[],
  minCount = 3
): RepeatedMealCandidate[] {
  const taken = new Set(defaultNames.map(normalizeFood));
  const groups = new Map<string, { entries: FoodInsightEntry[] }>();
  for (const entry of entries) {
    if (entry.defaultMealId) continue;
    const key = normalizeFood(entry.name);
    if (!key || taken.has(key)) continue;
    const group = groups.get(key);
    if (group) group.entries.push(entry);
    else groups.set(key, { entries: [entry] });
  }

  const recency = (e: FoodInsightEntry) => coerceDate(e.eatenAt ?? e.createdAt ?? e.date).getTime();

  return [...groups.values()]
    .filter((g) => g.entries.length >= minCount)
    .map((g) => {
      const sorted = [...g.entries].sort((a, b) => recency(b) - recency(a));
      const mealCounts = new Map<string, number>();
      for (const e of sorted) {
        if (e.meal) mealCounts.set(e.meal, (mealCounts.get(e.meal) ?? 0) + 1);
      }
      const meal = [...mealCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        name: sorted[0]!.name,
        count: sorted.length,
        items: sorted.find((e) => e.items)?.items ?? null,
        meal: displayMealLabel(meal),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP_LIMIT);
}
