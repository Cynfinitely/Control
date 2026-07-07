import { describe, expect, it } from "vitest";
import { coerceDate, formatDate, startOfDay } from "./date";

describe("date helpers", () => {
  it("coerceDate accepts ISO strings from unstable_cache round-trip", () => {
    const iso = "2026-01-15T00:00:00.000Z";
    const date = coerceDate(iso);
    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).toBe(new Date(iso).getTime());
  });

  it("formatDate accepts cached ISO strings", () => {
    expect(formatDate("2026-01-15T00:00:00.000Z")).toContain("2026");
  });

  it("startOfDay accepts ISO strings", () => {
    const day = startOfDay("2026-01-15T12:30:00.000Z");
    expect(day.getHours()).toBe(0);
    expect(day.getMinutes()).toBe(0);
  });
});
