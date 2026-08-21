import { describe, expect, it } from "vitest";
import { summarizeDayPrayers } from "./day-prayers";

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
