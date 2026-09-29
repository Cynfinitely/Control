import { describe, expect, it } from "vitest";
import { DEFAULT_NUTRITION_TARGETS, summarizeFoodRange } from "./summary";

describe("summarizeFoodRange", () => {
  it("averages logged days only and leaves out meals outside the range", () => {
    const summary = summarizeFoodRange(
      [
        {
          id: "1",
          date: new Date(2026, 7, 27),
          name: "Chicken salad",
          meal: "lunch",
          calories: 1800,
          protein: 90,
          carbs: 200,
          fat: 60,
        },
        {
          id: "2",
          date: new Date(2026, 7, 26),
          name: "Outside meal",
          meal: "snack",
          calories: 500,
          protein: 10,
          carbs: 20,
          fat: 10,
        },
      ],
      [
        { date: new Date(2026, 7, 27), glasses: 3 },
        { date: new Date(2026, 7, 28), glasses: 2 },
      ],
      new Date(2026, 7, 27),
      new Date(2026, 8, 2, 23, 59, 59, 999),
      DEFAULT_NUTRITION_TARGETS
    );

    expect(summary.dayCount).toBe(7);
    expect(summary.loggedDays).toBe(1);
    expect(summary.averages.calories).toBe(1800);
    expect(summary.averages.protein).toBe(90);
    expect(summary.totals.waterGlasses).toBe(5);
    expect(summary.days[0]?.underProtein).toBe(true);
    expect(summary.days[0]?.overCalories).toBe(false);
    expect(summary.days.some((day) => day.entries.some((entry) => entry.name === "Outside meal"))).toBe(
      false
    );
    expect(summary.days.filter((day) => !day.logged)).toHaveLength(6);
  });
});
