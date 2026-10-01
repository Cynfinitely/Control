import { describe, expect, it } from "vitest";
import { DEFAULT_MEAL_LABELS, suggestMealLabel } from "./meals";

const CLASSIC = ["Breakfast", "Lunch", "Dinner", "Snack"];

describe("suggestMealLabel", () => {
  it("maps times to classic labels", () => {
    expect(suggestMealLabel(CLASSIC, "07:30")).toBe("Breakfast");
    expect(suggestMealLabel(CLASSIC, "12:15")).toBe("Lunch");
    expect(suggestMealLabel(CLASSIC, "19:00")).toBe("Dinner");
  });

  it("suggests a snack between meal windows", () => {
    expect(suggestMealLabel(CLASSIC, "16:00")).toBe("Snack");
    expect(suggestMealLabel(CLASSIC, "23:10")).toBe("Snack");
  });

  it("returns null for labels without a time of day", () => {
    expect(suggestMealLabel(DEFAULT_MEAL_LABELS, "08:00")).toBeNull();
    expect(suggestMealLabel(DEFAULT_MEAL_LABELS, "16:00")).toBeNull();
  });

  it("returns null when the matching label is missing and no snack exists", () => {
    expect(suggestMealLabel(["Lunch", "Dinner"], "08:00")).toBeNull();
  });

  it("is case-insensitive and ignores invalid times", () => {
    expect(suggestMealLabel(["breakfast", "dinner"], "9:05")).toBe("breakfast");
    expect(suggestMealLabel(CLASSIC, "")).toBeNull();
    expect(suggestMealLabel(CLASSIC, "25:00")).toBeNull();
    expect(suggestMealLabel([], "08:00")).toBeNull();
  });
});
