import { describe, expect, it } from "vitest";
import {
  formatLongDateInZone,
  greetingForHour,
  hourInZone,
  isoWeekdayInZone,
  shouldNudgeWeeklyReview,
} from "./greeting";

describe("greeting helpers", () => {
  it("greets by hour", () => {
    expect(greetingForHour(6, "Ada")).toBe("Good morning, Ada");
    expect(greetingForHour(12, "Ada")).toBe("Good afternoon, Ada");
    expect(greetingForHour(16, "Ada")).toBe("Good afternoon, Ada");
    expect(greetingForHour(17, "Ada")).toBe("Good evening, Ada");
  });

  it("reads the hour in the user's timezone", () => {
    const instant = new Date("2026-10-01T22:30:00Z");
    expect(hourInZone(instant, "UTC")).toBe(22);
    expect(hourInZone(instant, "Europe/Istanbul")).toBe(1);
    expect(hourInZone(instant, "America/New_York")).toBe(18);
  });

  it("falls back for invalid zones instead of throwing", () => {
    const instant = new Date("2026-10-01T10:00:00Z");
    expect(() => hourInZone(instant, "Not/AZone")).not.toThrow();
    expect(() => formatLongDateInZone(instant, "Not/AZone")).not.toThrow();
  });

  it("formats the date in the user's timezone", () => {
    const instant = new Date("2026-10-01T22:30:00Z");
    const utc = formatLongDateInZone(instant, "UTC");
    expect(utc).toMatch(/^Thursday/);
    expect(utc).toContain("1 October 2026");
    const istanbul = formatLongDateInZone(instant, "Europe/Istanbul");
    expect(istanbul).toMatch(/^Friday/);
    expect(istanbul).toContain("2 October 2026");
  });

  it("computes the ISO weekday in the user's timezone", () => {
    const instant = new Date("2026-10-04T22:30:00Z"); // Sunday in UTC, Monday in Istanbul
    expect(isoWeekdayInZone(instant, "UTC")).toBe(7);
    expect(isoWeekdayInZone(instant, "Europe/Istanbul")).toBe(1);
  });
});

describe("shouldNudgeWeeklyReview", () => {
  it("never nudges once this week's review is complete", () => {
    expect(
      shouldNudgeWeeklyReview({ isoWeekday: 6, thisWeekCompleted: true, lastWeekStartedNotCompleted: true })
    ).toBe(false);
  });

  it("nudges Friday to Sunday", () => {
    expect(
      shouldNudgeWeeklyReview({ isoWeekday: 4, thisWeekCompleted: false, lastWeekStartedNotCompleted: false })
    ).toBe(false);
    expect(
      shouldNudgeWeeklyReview({ isoWeekday: 5, thisWeekCompleted: false, lastWeekStartedNotCompleted: false })
    ).toBe(true);
    expect(
      shouldNudgeWeeklyReview({ isoWeekday: 7, thisWeekCompleted: false, lastWeekStartedNotCompleted: false })
    ).toBe(true);
  });

  it("nudges early in the week when last week's review was left unfinished", () => {
    expect(
      shouldNudgeWeeklyReview({ isoWeekday: 1, thisWeekCompleted: false, lastWeekStartedNotCompleted: true })
    ).toBe(true);
  });
});
