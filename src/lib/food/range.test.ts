import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/date";
import { buildFoodReportUrl, parseFoodRange, shiftFoodRange } from "./range";

const now = new Date(2026, 8, 2, 15, 0, 0);

describe("parseFoodRange", () => {
  it("defaults to the last 7 days ending today", () => {
    const range = parseFoodRange({}, now);
    expect(range.preset).toBe("7d");
    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(7);
    expect(range.from.getDate()).toBe(27);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getFullYear()).toBe(2026);
    expect(range.to.getMonth()).toBe(8);
    expect(range.to.getDate()).toBe(2);
    expect(range.to.getHours()).toBe(23);
    expect(range.label).toBe(`${formatDate(range.from)} – ${formatDate(range.to)}`);
  });

  it("uses the previous Monday–Sunday for last week", () => {
    const range = parseFoodRange({ range: "last-week" }, now);
    expect(range.preset).toBe("last-week");
    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(7);
    expect(range.from.getDate()).toBe(24);
    expect(range.to.getMonth()).toBe(7);
    expect(range.to.getDate()).toBe(30);
    expect(range.to.getHours()).toBe(23);
  });

  it("swaps custom dates when from is after to", () => {
    const range = parseFoodRange(
      { range: "custom", from: "2026-09-10", to: "2026-09-01" },
      now
    );
    expect(range.preset).toBe("custom");
    expect(range.from.getMonth()).toBe(8);
    expect(range.from.getDate()).toBe(1);
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getMonth()).toBe(8);
    expect(range.to.getDate()).toBe(10);
    expect(range.to.getHours()).toBe(23);
  });
});

describe("shiftFoodRange", () => {
  it("moves a week view by whole weeks and keeps the week preset", () => {
    const range = parseFoodRange({ range: "week" }, now);
    expect(range.from.getDate()).toBe(31);
    expect(range.from.getMonth()).toBe(7);
    const prev = shiftFoodRange(range, -1);
    expect(prev).toEqual({ range: "week", anchor: "2026-08-24" });
  });
});

describe("buildFoodReportUrl", () => {
  it("omits the default last-7-days preset", () => {
    expect(buildFoodReportUrl("/dashboard/food/report", { range: "7d" })).toBe(
      "/dashboard/food/report"
    );
  });

  it("keeps a custom range in the query string", () => {
    expect(
      buildFoodReportUrl("/dashboard/food/report", {
        range: "custom",
        from: "2026-09-01",
        to: "2026-09-10",
      })
    ).toBe("/dashboard/food/report?range=custom&from=2026-09-01&to=2026-09-10");
  });
});
