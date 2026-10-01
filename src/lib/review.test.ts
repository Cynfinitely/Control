import { describe, expect, it } from "vitest";
import {
  REVIEW_STEPS,
  isReviewComplete,
  isReviewStepId,
  isWeekKey,
  parseCompletedSteps,
  reviewProgress,
  serializeCompletedSteps,
  toggleCompletedStep,
} from "./review";

describe("review steps", () => {
  it("has unique, stable ids", () => {
    const ids = REVIEW_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["inbox", "goals", "prayers", "spending", "people", "plan-ahead"]);
  });

  it("recognises step ids", () => {
    expect(isReviewStepId("goals")).toBe(true);
    expect(isReviewStepId("nope")).toBe(false);
    expect(isReviewStepId(undefined)).toBe(false);
  });
});

describe("parseCompletedSteps", () => {
  it("handles empty input", () => {
    expect(parseCompletedSteps("").size).toBe(0);
    expect(parseCompletedSteps(null).size).toBe(0);
    expect(parseCompletedSteps(undefined).size).toBe(0);
  });

  it("drops unknown ids, blanks and whitespace", () => {
    expect([...parseCompletedSteps(" goals, ,bogus,inbox,goals ")]).toEqual(["goals", "inbox"]);
  });
});

describe("serializeCompletedSteps", () => {
  it("orders by step order and de-duplicates", () => {
    expect(serializeCompletedSteps(["people", "inbox", "people", "x"])).toBe("inbox,people");
    expect(serializeCompletedSteps([])).toBe("");
  });

  it("round-trips", () => {
    const csv = "inbox,goals,plan-ahead";
    expect(serializeCompletedSteps(parseCompletedSteps(csv))).toBe(csv);
  });
});

describe("toggleCompletedStep", () => {
  it("flips when done is omitted", () => {
    expect(toggleCompletedStep("", "goals")).toBe("goals");
    expect(toggleCompletedStep("inbox,goals", "goals")).toBe("inbox");
  });

  it("sets explicitly and is idempotent", () => {
    expect(toggleCompletedStep("goals", "goals", true)).toBe("goals");
    expect(toggleCompletedStep("goals", "inbox", false)).toBe("goals");
    expect(toggleCompletedStep("goals,inbox", "inbox", false)).toBe("goals");
  });
});

describe("progress and completion", () => {
  it("counts known steps only", () => {
    expect(reviewProgress(["inbox", "x"])).toEqual({ done: 1, total: REVIEW_STEPS.length });
  });

  it("is complete only when every step is done", () => {
    const all = REVIEW_STEPS.map((s) => s.id);
    expect(isReviewComplete(all)).toBe(true);
    expect(isReviewComplete(all.join(","))).toBe(true);
    expect(isReviewComplete(all.slice(1))).toBe(false);
    expect(isReviewComplete("")).toBe(false);
    expect(isReviewComplete(null)).toBe(false);
  });
});

describe("isWeekKey", () => {
  it("validates ISO week keys", () => {
    expect(isWeekKey("2026-W40")).toBe(true);
    expect(isWeekKey("2026-40")).toBe(false);
    expect(isWeekKey(null)).toBe(false);
  });
});
