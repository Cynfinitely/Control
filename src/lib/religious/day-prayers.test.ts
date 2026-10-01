import { describe, expect, it } from "vitest";
import { groupPendingQaza, prayerLabel, prayersToMarkOnTime, summarizeDayPrayers } from "./day-prayers";

describe("summarizeDayPrayers", () => {
  it("treats unlogged prayers as not on time", () => {
    expect(summarizeDayPrayers([])).toEqual({
      onTime: 0,
      missed: 0,
      unlogged: 5,
      total: 5,
    });
  });

  it("counts one missed and four unlogged as 0 on time", () => {
    expect(summarizeDayPrayers([{ prayer: "fajr", status: "missed" }])).toEqual({
      onTime: 0,
      missed: 1,
      unlogged: 4,
      total: 5,
    });
  });

  it("counts only canonical prayers as on time", () => {
    expect(
      summarizeDayPrayers([
        { prayer: "fajr", status: "ontime" },
        { prayer: "dhuhr", status: "ontime" },
        { prayer: "asr", status: "missed" },
      ])
    ).toEqual({
      onTime: 2,
      missed: 1,
      unlogged: 2,
      total: 5,
    });
  });

  it("does not treat duplicate logs as extra prayers", () => {
    expect(
      summarizeDayPrayers([
        { prayer: "fajr", status: "ontime" },
        { prayer: "fajr", status: "ontime" },
        { prayer: "fajr", status: "missed" },
      ])
    ).toEqual({
      onTime: 0,
      missed: 1,
      unlogged: 4,
      total: 5,
    });
  });

  it("ignores unknown prayer names", () => {
    expect(
      summarizeDayPrayers([{ prayer: "tahajjud", status: "ontime" }])
    ).toEqual({
      onTime: 0,
      missed: 0,
      unlogged: 5,
      total: 5,
    });
  });
});

describe("prayerLabel", () => {
  it("capitalises prayer keys", () => {
    expect(prayerLabel("fajr")).toBe("Fajr");
    expect(prayerLabel("isha")).toBe("Isha");
    expect(prayerLabel("witr")).toBe("Witr");
  });
});

describe("prayersToMarkOnTime", () => {
  it("only fills prayers without a status and never overwrites missed", () => {
    expect(prayersToMarkOnTime({ fajr: "missed", dhuhr: "ontime" })).toEqual(["asr", "maghrib", "isha"]);
    expect(prayersToMarkOnTime({})).toEqual(["fajr", "dhuhr", "asr", "maghrib", "isha"]);
    expect(
      prayersToMarkOnTime({ fajr: "ontime", dhuhr: "ontime", asr: "missed", maghrib: "ontime", isha: "ontime" })
    ).toEqual([]);
  });
});

describe("groupPendingQaza", () => {
  it("groups by prayer in canonical order, oldest first", () => {
    const groups = groupPendingQaza([
      { id: "a", prayer: "isha", sourceDate: "2026-09-03T00:00:00.000Z" },
      { id: "b", prayer: "fajr", sourceDate: new Date("2026-09-05T00:00:00Z") },
      { id: "c", prayer: "fajr", sourceDate: new Date("2026-09-01T00:00:00Z") },
    ]);
    expect(groups.map((g) => [g.prayer, g.count])).toEqual([
      ["fajr", 2],
      ["isha", 1],
    ]);
    expect(groups[0]!.items.map((q) => q.id)).toEqual(["c", "b"]);
    expect(groups[0]!.oldest).toEqual(new Date("2026-09-01T00:00:00Z"));
    expect(groups[0]!.newest).toEqual(new Date("2026-09-05T00:00:00Z"));
  });

  it("returns nothing when there is no pending qaza", () => {
    expect(groupPendingQaza([])).toEqual([]);
  });
});
