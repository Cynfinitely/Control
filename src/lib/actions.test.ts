import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { num } from "./actions";

describe("num", () => {
  it("parses dot decimals", () => {
    expect(num("72.5")).toBe(72.5);
  });

  it("accepts a comma as the decimal separator", () => {
    expect(num("72,5")).toBe(72.5);
    expect(num(" 0,75 ")).toBe(0.75);
  });

  it("returns the fallback for empty or invalid input", () => {
    expect(num(null)).toBe(0);
    expect(num("")).toBe(0);
    expect(num("abc", 3)).toBe(3);
  });
});
