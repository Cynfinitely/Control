import { describe, expect, it } from "vitest";
import {
  type FoodInsightEntry,
  instantFromLocal,
  minutesInZone,
  timeInZone,
  repeatedMealCandidates,
  weeklyFoodSummary,
  weeklyObservations,
} from "./insights";

const TZ = "UTC";

function entry(day: number, time: string | null, overrides: Partial<FoodInsightEntry> = {}): FoodInsightEntry {
  const [h, m] = time ? time.split(":").map(Number) : [0, 0];
  return {
    name: "Office lunch",
    meal: "Meal 1",
    items: null,
    date: new Date(2026, 8, day),
    eatenAt: time ? new Date(Date.UTC(2026, 8, day, h, m)) : null,
    defaultMealId: null,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ...overrides,
  };
}

describe("time zone helpers", () => {
  it("reads local time in the given zone", () => {
    const d = new Date(Date.UTC(2026, 8, 21, 9, 30));
    expect(minutesInZone(d, "UTC")).toBe(9 * 60 + 30);
    expect(minutesInZone(d, "Europe/Istanbul")).toBe(12 * 60 + 30);
    expect(timeInZone(d, "Europe/Istanbul")).toBe("12:30");
  });

  it("builds an instant from a wall-clock day and time", () => {
    expect(instantFromLocal("2026-09-21", "12:30", "Europe/Istanbul")?.toISOString()).toBe(
      "2026-09-21T09:30:00.000Z"
    );
    expect(instantFromLocal("2026-09-21", "noon", "UTC")).toBeNull();
  });
});

describe("weeklyFoodSummary", () => {
  const entries: FoodInsightEntry[] = [
    entry(21, "11:40", { items: "rye bread, turkey, banana" }),
    entry(21, "21:10", { name: "Chocolate", meal: "Snack" }),
    entry(22, "12:10", { items: "Rye bread, skyr, banana", defaultMealId: "dm1" }),
    entry(23, "12:25", { items: "rye bread, banana", defaultMealId: "dm1" }),
    entry(23, "20:30", { name: "Nuts", meal: "snack" }),
    entry(24, null, { name: "Pasta", meal: "dinner", items: "rye bread", calories: 600, protein: 20 }),
  ];
  const summary = weeklyFoodSummary(entries, {
    timeZone: TZ,
    defaultMealNames: new Map([["dm1", "Office Lunch"]]),
  });

  it("counts days and meals", () => {
    expect(summary.daysLogged).toBe(4);
    expect(summary.totalMeals).toBe(6);
    expect(summary.topMeals[0]).toEqual({ label: "Office lunch", count: 3, days: 3 });
  });

  it("counts foods by occasion and by day", () => {
    expect(summary.topFoods[0]).toEqual({ label: "rye bread", count: 4, days: 4 });
    expect(summary.topFoods[1]).toEqual({ label: "banana", count: 3, days: 3 });
  });

  it("tracks snacks, including legacy lowercase labels", () => {
    expect(summary.snackCount).toBe(2);
    expect(summary.snackDays).toBe(2);
    expect(summary.lateSnackDays).toBe(2);
  });

  it("ignores entries without a time for timing stats", () => {
    expect(summary.firstMealWindow).toEqual({ fromMin: 11 * 60 + 30, toMin: 12 * 60 + 30 });
  });

  it("tracks Default Meal usage and nutrition only when present", () => {
    expect(summary.defaultMealUses).toBe(2);
    expect(summary.topDefaultMeals[0]?.label).toBe("Office Lunch");
    expect(summary.nutrition).toEqual({ calories: 600, protein: 20, carbs: 0, fat: 0, daysWithData: 1 });
  });

  it("produces neutral observations", () => {
    expect(weeklyObservations(summary)).toEqual([
      "You logged food on 4 of 7 days.",
      "Your first meal was usually between 11:30–12:30.",
      "You had snacks after 20:00 on 2 days.",
      "You ate your Office Lunch 2 times this week.",
      "You logged rye bread on 4 occasions.",
      "You ate banana on 3 days.",
    ]);
  });

  it("returns no nutrition and no observations for an empty week", () => {
    const empty = weeklyFoodSummary([], { timeZone: TZ });
    expect(empty.nutrition).toBeNull();
    expect(empty.firstMealWindow).toBeNull();
    expect(weeklyObservations(empty)).toEqual([]);
  });

  it("handles legacy rows with no meal and no time", () => {
    const legacy = weeklyFoodSummary([entry(21, null, { meal: null })], { timeZone: TZ });
    expect(legacy.daysLogged).toBe(1);
    expect(legacy.snackCount).toBe(0);
    expect(legacy.firstMealWindow).toBeNull();
  });
});

describe("repeatedMealCandidates", () => {
  it("suggests names logged at least three times that are not defaults", () => {
    const entries = [
      entry(21, "12:00", { items: "chicken, salad" }),
      entry(22, "12:00", { name: "office Lunch" }),
      entry(23, "12:00"),
      entry(21, "19:00", { name: "Salmon" }),
      entry(22, "19:00", { name: "Salmon" }),
      entry(23, "19:00", { name: "Salmon" }),
      entry(24, "19:00", { name: "Salmon", defaultMealId: "dm" }),
    ];
    expect(repeatedMealCandidates(entries, ["Salmon"])).toEqual([
      { name: "Office lunch", count: 3, items: "chicken, salad", meal: "Meal 1" },
    ]);
  });
});
