import { describe, expect, it } from "vitest";
import {
  DURATION_PRESETS,
  monthMigraineStats,
  painBand,
  painToneClass,
} from "./pain";

describe("painBand", () => {
  it("classifies 1–3 as mild", () => {
    expect(painBand(1)).toBe("mild");
    expect(painBand(3)).toBe("mild");
  });

  it("classifies 4–6 as moderate", () => {
    expect(painBand(4)).toBe("moderate");
    expect(painBand(6)).toBe("moderate");
  });

  it("classifies 7–10 as severe", () => {
    expect(painBand(7)).toBe("severe");
    expect(painBand(10)).toBe("severe");
  });

  it("returns null outside 1–10", () => {
    expect(painBand(0)).toBeNull();
    expect(painBand(11)).toBeNull();
  });
});

describe("painToneClass", () => {
  it("uses muted gold for mild pain", () => {
    expect(painToneClass(2)).toContain("amber");
  });

  it("uses terracotta for moderate pain", () => {
    expect(painToneClass(5)).toContain("orange");
  });

  it("uses deep rose for severe pain, not neon red", () => {
    const tone = painToneClass(9);
    expect(tone).toContain("rose");
    expect(tone).not.toContain("red-");
  });

  it("returns an empty string for invalid pain", () => {
    expect(painToneClass(0)).toBe("");
  });
});

describe("DURATION_PRESETS", () => {
  it("maps the four diary chips to minutes", () => {
    expect(DURATION_PRESETS.map((p) => p.minutes)).toEqual([90, 180, 480, 1440]);
  });
});

describe("monthMigraineStats", () => {
  it("returns zeros for an empty month", () => {
    expect(monthMigraineStats([])).toEqual({
      migraineDays: 0,
      averagePain: 0,
      severeDays: 0,
    });
  });

  it("counts days, averages peak pain, and tallies severe days", () => {
    expect(
      monthMigraineStats([{ pain: 2 }, { pain: 8 }, { pain: 5 }])
    ).toEqual({
      migraineDays: 3,
      averagePain: 5,
      severeDays: 1,
    });
  });
});
