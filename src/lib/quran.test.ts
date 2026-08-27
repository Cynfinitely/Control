import { describe, expect, it } from "vitest";
import {
  QURAN_TOTAL_PAGES,
  advanceBookmark,
  clampPage,
  juzForPage,
  khatmPercent,
  readingRange,
} from "./quran";

describe("juzForPage", () => {
  it("maps page 1 to juz 1", () => {
    expect(juzForPage(1)).toBe(1);
  });

  it("maps page 21 to juz 1 and page 22 to juz 2", () => {
    expect(juzForPage(21)).toBe(1);
    expect(juzForPage(22)).toBe(2);
  });

  it("maps page 582 and 604 to juz 30", () => {
    expect(juzForPage(582)).toBe(30);
    expect(juzForPage(604)).toBe(30);
  });
});

describe("advanceBookmark", () => {
  it("advances currentPage as the next page to read", () => {
    expect(advanceBookmark({ currentPage: 127, khatmsCompleted: 0, pagesRead: 5 })).toEqual({
      currentPage: 132,
      khatmsCompleted: 0,
      fromPage: 127,
      toPage: 131,
    });
  });

  it("wraps from the end of the mushaf and increments khatms", () => {
    expect(advanceBookmark({ currentPage: 602, khatmsCompleted: 0, pagesRead: 5 })).toEqual({
      currentPage: 3,
      khatmsCompleted: 1,
      fromPage: 602,
      toPage: 2,
    });
  });

  it("completes a khatm exactly at page 604", () => {
    expect(advanceBookmark({ currentPage: 600, khatmsCompleted: 1, pagesRead: 5 })).toEqual({
      currentPage: 1,
      khatmsCompleted: 2,
      fromPage: 600,
      toPage: 604,
    });
  });

  it("ignores non-positive page counts", () => {
    expect(advanceBookmark({ currentPage: 10, khatmsCompleted: 0, pagesRead: 0 })).toEqual({
      currentPage: 10,
      khatmsCompleted: 0,
      fromPage: 10,
      toPage: 10,
    });
  });
});

describe("readingRange and helpers", () => {
  it("formats a contiguous range", () => {
    expect(readingRange(127, 131)).toBe("pp. 127–131");
  });

  it("formats a wrap range", () => {
    expect(readingRange(602, 2)).toBe("pp. 602–604, 1–2");
  });

  it("clamps pages into 1–604", () => {
    expect(clampPage(0)).toBe(1);
    expect(clampPage(700)).toBe(QURAN_TOTAL_PAGES);
    expect(clampPage(42)).toBe(42);
  });

  it("computes khatm percent from the next page to read", () => {
    expect(khatmPercent(1)).toBe(0);
    expect(khatmPercent(302)).toBe(50);
    expect(khatmPercent(604)).toBe(100);
  });
});
