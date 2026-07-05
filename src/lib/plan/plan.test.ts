import { describe, expect, it } from "vitest";
import { blocksOverlap, findOverlappingBlock, sortBlocksByTime } from "@/lib/plan/overlap";
import {
  isValidTimeRange,
  parseTimeToMinutes,
  isBlockOverdue,
  blockDurationMinutes,
  crossesMidnight,
} from "@/lib/plan/time";
import { inferKindFromTitle } from "@/lib/plan/infer-kind";
import { parsePlanText } from "@/lib/plan/parse-text";

const TURKISH_SAMPLE = `02:55  Sabah alarm
02:59  Sabah namazı
03:10  Tekrar uyku

07:30  Kalkış
07:45  Kur'an
08:20  Spor
09:30  Duş
10:00  İlk öğün

10:30  Fince writing/speaking
12:00  Mola
13:30  Öğle namazı
13:45  Kaza bloğu

14:00  Kendi proje / AI coding
15:00  Gaming + kayıt
16:00  Edit / YouTube

17:00  Risale + Pırlanta
18:09  İkindi
18:30  Akşam yemeği / aile / serbest zaman

22:30  Sosyal medya kapanır
22:51  Akşam namazı
23:00  Cevşen / dua
23:45  Yatsı
00:05  Uyku`;

describe("plan time utilities", () => {
  it("parses and validates time ranges", () => {
    expect(parseTimeToMinutes("09:00")).toBe(540);
    expect(isValidTimeRange("09:00", "10:00")).toBe(true);
    expect(isValidTimeRange("10:00", "09:00")).toBe(false);
  });

  it("supports overnight durations", () => {
    expect(blockDurationMinutes("23:45", "00:05")).toBe(20);
    expect(crossesMidnight("23:45", "00:05")).toBe(true);
    expect(isValidTimeRange("23:45", "00:05")).toBe(true);
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

describe("inferKindFromTitle", () => {
  it("infers kinds from Turkish and English titles", () => {
    expect(inferKindFromTitle("Sabah namazı")).toBe("prayer");
    expect(inferKindFromTitle("Spor")).toBe("workout");
    expect(inferKindFromTitle("Mola")).toBe("break");
    expect(inferKindFromTitle("İlk öğün")).toBe("meal");
    expect(inferKindFromTitle("Kendi proje / AI coding")).toBe("custom");
  });
});

describe("parsePlanText", () => {
  it("parses the full Turkish sample", () => {
    const { entries, warnings } = parsePlanText(TURKISH_SAMPLE);
    expect(entries).toHaveLength(23);
    expect(warnings).toHaveLength(0);
    expect(entries[0]).toMatchObject({ startTime: "02:55", endTime: "02:59", title: "Sabah alarm" });
    expect(entries[entries.length - 1]).toMatchObject({
      startTime: "00:05",
      title: "Uyku",
    });
  });

  it("sorts midnight rollover correctly", () => {
    const { entries } = parsePlanText(`23:45  Yatsı\n00:05  Uyku`);
    expect(entries[0].startTime).toBe("23:45");
    expect(entries[0].endTime).toBe("00:05");
    expect(entries[1].startTime).toBe("00:05");
  });

  it("warns on invalid lines without failing the whole import", () => {
    const { entries, warnings } = parsePlanText(`09:00  Valid\nnot a line\n10:00  Also valid`);
    expect(entries).toHaveLength(2);
    expect(warnings.some((w) => w.includes("Line 2"))).toBe(true);
  });
});
