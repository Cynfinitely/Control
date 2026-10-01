import { describe, expect, it } from "vitest";
import { formatPace, formatPlan, formatWorkoutSummary, nextSetPrefill, setProgress } from "./session";

describe("nextSetPrefill", () => {
  it("falls back to planned reps when there are no sets", () => {
    expect(nextSetPrefill([], 10)).toEqual({ reps: "10", weightKg: "", durationSec: "" });
  });

  it("repeats the previous set", () => {
    const sets = [
      { reps: 8, weightKg: 60, durationSec: null },
      { reps: 6, weightKg: 62.5, durationSec: null },
    ];
    expect(nextSetPrefill(sets, 10)).toEqual({ reps: "6", weightKg: "62.5", durationSec: "" });
  });

  it("uses planned reps when the previous set had none", () => {
    expect(nextSetPrefill([{ reps: null, weightKg: null, durationSec: 45 }], 12)).toEqual({
      reps: "12",
      weightKg: "",
      durationSec: "45",
    });
  });

  it("is empty with nothing to go on", () => {
    expect(nextSetPrefill([], null)).toEqual({ reps: "", weightKg: "", durationSec: "" });
  });
});

describe("formatPlan", () => {
  it("formats sets × reps", () => {
    expect(formatPlan(3, 10)).toBe("3 × 10");
    expect(formatPlan(3, null)).toBe("3 sets");
    expect(formatPlan(1, null)).toBe("1 set");
    expect(formatPlan(null, null)).toBeNull();
  });
});

describe("setProgress", () => {
  it("reports progress toward planned sets", () => {
    expect(setProgress(2, 3)).toEqual({ done: 2, planned: 3, complete: false, label: "2 of 3 sets" });
    expect(setProgress(3, 3)?.complete).toBe(true);
    expect(setProgress(4, 3)?.complete).toBe(true);
    expect(setProgress(1, null)).toBeNull();
  });
});

describe("formatWorkoutSummary", () => {
  it("summarises cardio and gym sessions", () => {
    expect(formatWorkoutSummary({ activityType: "run", distanceM: 5000, durationMin: 28 })).toBe("5.0 km · 28 min");
    expect(formatWorkoutSummary({ activityType: "swim", distanceM: 1500, durationMin: null })).toBe("1500 m");
    expect(
      formatWorkoutSummary({ activityType: "walk", walkKind: "indoor", distanceM: null, durationMin: 30 })
    ).toBe("Indoor · 30 min");
    expect(formatWorkoutSummary({ activityType: "gym", distanceM: null, durationMin: null, exerciseCount: 1 })).toBe(
      "1 exercise"
    );
    expect(formatWorkoutSummary({ activityType: "other", distanceM: null, durationMin: null })).toBe("Other");
  });
});

describe("formatPace", () => {
  it("computes min/km", () => {
    expect(formatPace(5000, 28)).toBe("5:36 /km");
    expect(formatPace(null, 28)).toBeNull();
    expect(formatPace(5000, 0)).toBeNull();
  });
});
