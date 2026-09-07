import { describe, expect, it } from "vitest";
import { parseProgramText } from "./parse-program-text";

const FULL_BODY = `FULL BODY WORKOUT PROGRAM

1. Bench Press — 3 sets
2. Dumbbell Pullover — 3 sets
3. Reverse Grip Lat Pulldown — 3 sets
4. Seated Cable Row — 3 sets
5. Standing Military Press — 3 sets
6. Barbell Curl — 3 sets
7. Overhead Dumbbell Triceps Extension — 3 sets
8. Squat — 3 sets`;

describe("parseProgramText", () => {
  it("parses a titled numbered list with em-dash set counts", () => {
    const result = parseProgramText(FULL_BODY);

    expect(result.error).toBeUndefined();
    expect(result.name).toBe("FULL BODY WORKOUT PROGRAM");
    expect(result.exercises).toHaveLength(8);
    expect(result.exercises[0]).toMatchObject({
      name: "Bench Press",
      plannedSets: 3,
      plannedReps: null,
    });
    expect(result.exercises[7]).toMatchObject({
      name: "Squat",
      plannedSets: 3,
      plannedReps: null,
    });
    expect(result.warnings).toEqual([]);
  });

  it("parses 3x8 as sets and reps", () => {
    const result = parseProgramText("Push\nBench Press 3x8");

    expect(result.error).toBeUndefined();
    expect(result.name).toBe("Push");
    expect(result.exercises).toEqual([
      expect.objectContaining({ name: "Bench Press", plannedSets: 3, plannedReps: 8 }),
    ]);
  });

  it("uses a default name when the title is missing", () => {
    const result = parseProgramText("1. Bench Press — 3 sets");

    expect(result.error).toBeUndefined();
    expect(result.name).toBe("Workout program");
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].name).toBe("Bench Press");
  });

  it("warns and defaults to 3 sets when a numbered exercise has no set count", () => {
    const result = parseProgramText("Push\n1. Bench Press");

    expect(result.error).toBeUndefined();
    expect(result.exercises).toEqual([
      expect.objectContaining({ name: "Bench Press", plannedSets: 3, plannedReps: null }),
    ]);
    expect(result.warnings.some((w) => /sets/i.test(w))).toBe(true);
  });

  it("warns on junk lines and still parses valid exercises", () => {
    const result = parseProgramText("Push\n???\n1. Bench Press — 3 sets");

    expect(result.error).toBeUndefined();
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].name).toBe("Bench Press");
    expect(result.warnings.some((w) => /could not parse/i.test(w))).toBe(true);
  });

  it("returns an error when input is empty", () => {
    const result = parseProgramText("   \n  ");

    expect(result.error).toBeTruthy();
    expect(result.exercises).toEqual([]);
  });

  it("returns an error when no exercises are found", () => {
    const result = parseProgramText("FULL BODY WORKOUT PROGRAM\n\n");

    expect(result.error).toBeTruthy();
    expect(result.exercises).toEqual([]);
    expect(result.name).toBe("FULL BODY WORKOUT PROGRAM");
  });
});
