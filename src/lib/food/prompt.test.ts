import { describe, expect, it } from "vitest";
import { buildFoodRangePrompt, type FoodRangePromptSnapshot } from "./prompt";

function snapshot(overrides: Partial<FoodRangePromptSnapshot> = {}): FoodRangePromptSnapshot {
  return {
    label: "27 Aug 2026 – 02 Sep 2026",
    from: new Date(2026, 7, 27),
    to: new Date(2026, 8, 2, 23, 59, 59, 999),
    targets: { calories: 2000, protein: 120, carbs: 220, fat: 70 },
    days: [
      {
        date: new Date(2026, 7, 27),
        calories: 1800,
        protein: 90,
        carbs: 200,
        fat: 60,
        waterGlasses: 6,
        logged: true,
      },
    ],
    entries: [
      {
        date: new Date(2026, 7, 27),
        name: "Chicken salad",
        meal: "lunch",
        calories: 1800,
        protein: 90,
        carbs: 200,
        fat: 60,
      },
    ],
    ...overrides,
  };
}

describe("buildFoodRangePrompt", () => {
  it("includes the range, a logged meal, and that day's totals", () => {
    const text = buildFoodRangePrompt(snapshot());
    expect(text).toContain("27 Aug 2026 – 02 Sep 2026");
    expect(text).toContain("Chicken salad");
    expect(text).toContain("1800");
    expect(text).toContain("2026-08-27");
  });

  it("does not mention days outside the selected range", () => {
    const text = buildFoodRangePrompt(snapshot());
    expect(text).not.toContain("2026-08-26");
    expect(text).not.toContain("2026-09-03");
  });
});
