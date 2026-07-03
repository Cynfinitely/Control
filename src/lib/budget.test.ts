import { describe, expect, it } from "vitest";
import {
  computeBalance,
  computePeriodTotals,
  computeSavingsRate,
  eurosToCents,
  formatEuro,
  parseAmountToCents,
  sumByType,
} from "./budget";

const anchor = new Date("2026-01-01T00:00:00");
const profile = { startingBalanceCents: 100000, startingBalanceDate: anchor };

const txs = [
  {
    type: "income",
    amountCents: 50000,
    date: new Date("2026-01-15"),
    deletedAt: null,
  },
  {
    type: "expense",
    amountCents: 20000,
    date: new Date("2026-01-20"),
    deletedAt: null,
  },
  {
    type: "income",
    amountCents: 10000,
    date: new Date("2025-12-31"),
    deletedAt: null,
  },
  {
    type: "expense",
    amountCents: 5000,
    date: new Date("2026-02-01"),
    deletedAt: new Date(),
  },
];

describe("budget math", () => {
  it("converts euros to cents", () => {
    expect(eurosToCents(12.34)).toBe(1234);
    expect(parseAmountToCents("12,50")).toBe(1250);
    expect(parseAmountToCents("0")).toBeNull();
  });

  it("formats euro amounts", () => {
    expect(formatEuro(1234)).toContain("12");
  });

  it("excludes transactions before anchor and soft-deleted rows", () => {
    expect(computeBalance(profile, txs)).toBe(100000 + 50000 - 20000);
    expect(sumByType(txs, "income", { anchor })).toBe(50000);
  });

  it("computes period totals", () => {
    const totals = computePeriodTotals(txs, new Date("2026-01-01"), new Date("2026-01-31"));
    expect(totals.incomeCents).toBe(50000);
    expect(totals.expenseCents).toBe(20000);
    expect(totals.netCents).toBe(30000);
  });

  it("guards savings rate when income is zero", () => {
    expect(computeSavingsRate(0, 1000)).toBeNull();
    expect(computeSavingsRate(10000, 4000)).toBe(60);
  });
});
