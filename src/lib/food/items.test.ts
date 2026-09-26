import { describe, expect, it } from "vitest";
import { joinItems, splitItems } from "./items";
import { displayMealLabel, isSnack, parseFoodMode, parseMealLabels, serializeMealLabels } from "./meals";

describe("splitItems", () => {
  it("splits on commas, semicolons and newlines", () => {
    expect(splitItems("rye bread, turkey; skyr\nbanana")).toEqual(["rye bread", "turkey", "skyr", "banana"]);
  });

  it("trims, collapses whitespace and de-duplicates case-insensitively", () => {
    expect(splitItems("  Rye   bread , rye bread,, Skyr ")).toEqual(["Rye bread", "Skyr"]);
  });

  it("returns an empty list for empty input", () => {
    expect(splitItems(null)).toEqual([]);
    expect(splitItems("  ,  ")).toEqual([]);
  });

  it("round-trips through joinItems", () => {
    expect(joinItems(splitItems("a,b"))).toBe("a, b");
  });
});

describe("meal labels", () => {
  it("falls back to flexible defaults", () => {
    expect(parseMealLabels(null)).toEqual(["Meal 1", "Meal 2", "Snack"]);
    expect(parseMealLabels("\n \n")).toEqual(["Meal 1", "Meal 2", "Snack"]);
  });

  it("parses and de-duplicates custom labels", () => {
    expect(parseMealLabels("Brunch\nDinner\nbrunch\n")).toEqual(["Brunch", "Dinner"]);
    expect(serializeMealLabels([" Brunch ", "Dinner"])).toBe("Brunch\nDinner");
  });

  it("title-cases legacy meal values and keeps custom ones", () => {
    expect(displayMealLabel("breakfast")).toBe("Breakfast");
    expect(displayMealLabel("Meal 2")).toBe("Meal 2");
    expect(displayMealLabel(null)).toBeNull();
  });

  it("detects snacks regardless of case", () => {
    expect(isSnack("snack")).toBe(true);
    expect(isSnack("Evening snack")).toBe(true);
    expect(isSnack("Meal 1")).toBe(false);
    expect(isSnack(null)).toBe(false);
  });

  it("parses modes safely", () => {
    expect(parseFoodMode("optimize")).toBe("optimize");
    expect(parseFoodMode("bogus")).toBe("observe");
  });
});
