import { describe, expect, it } from "vitest";
import { blocksOverlap, findOverlappingBlock, sortBlocksByTime } from "@/lib/plan/overlap";
import { isValidTimeRange, parseTimeToMinutes, isBlockOverdue } from "@/lib/plan/time";

describe("plan time utilities", () => {
  it("parses and validates time ranges", () => {
    expect(parseTimeToMinutes("09:00")).toBe(540);
    expect(isValidTimeRange("09:00", "10:00")).toBe(true);
    expect(isValidTimeRange("10:00", "09:00")).toBe(false);
  });

  it("detects overdue blocks", () => {
    const now = new Date("2026-07-05T15:00:00");
    expect(isBlockOverdue("09:00", "10:00", "planned", now)).toBe(true);
    expect(isBlockOverdue("09:00", "10:00", "done", now)).toBe(false);
  });
});

describe("plan overlap detection", () => {
  const blocks = [
    { id: "a", startTime: "09:00", endTime: "10:00" },
    { id: "b", startTime: "11:00", endTime: "12:00" },
  ];

  it("finds overlapping blocks", () => {
    expect(blocksOverlap(blocks[0], { startTime: "09:30", endTime: "10:30" })).toBe(true);
    expect(blocksOverlap(blocks[0], { startTime: "10:00", endTime: "11:00" })).toBe(false);
    expect(findOverlappingBlock(blocks, { startTime: "09:30", endTime: "09:45" })?.id).toBe("a");
    expect(findOverlappingBlock(blocks, { startTime: "10:00", endTime: "11:00" })).toBeNull();
  });

  it("sorts blocks by start time", () => {
    const sorted = sortBlocksByTime([
      { startTime: "13:00", sortOrder: 0 },
      { startTime: "09:00", sortOrder: 1 },
    ]);
    expect(sorted[0].startTime).toBe("09:00");
  });
});
