import { describe, expect, it } from "vitest";
import {
  SUGGESTED_DAILY_READINGS,
  readingProgress,
  sumAmounts,
} from "./daily-readings";

describe("SUGGESTED_DAILY_READINGS", () => {
  it("includes a Quran item linked to khatm logging", () => {
    const quran = SUGGESTED_DAILY_READINGS.find((item) => item.linkKind === "quran");
    expect(quran).toMatchObject({
      name: "Quran",
      unit: "pages",
      dailyTarget: 5,
    });
  });

  it("includes Jawshan, Risale-i Nur, and Gülen as customizable items", () => {
    expect(SUGGESTED_DAILY_READINGS.map((item) => item.name)).toEqual([
      "Quran",
      "Jawshan",
      "Risale-i Nur",
      "Gülen",
    ]);
  });
});

describe("readingProgress", () => {
  it("is done when logged meets or exceeds the target", () => {
    expect(readingProgress(5, 5)).toEqual({ pct: 100, done: true });
    expect(readingProgress(7, 5)).toEqual({ pct: 100, done: true });
  });

  it("caps percent at 100 and treats empty target as incomplete", () => {
    expect(readingProgress(2, 5)).toEqual({ pct: 40, done: false });
    expect(readingProgress(1, 0)).toEqual({ pct: 0, done: false });
  });
});

describe("sumAmounts", () => {
  it("sums entry amounts for the day", () => {
    expect(sumAmounts([{ amount: 2 }, { amount: 3 }])).toBe(5);
    expect(sumAmounts([])).toBe(0);
  });
});
