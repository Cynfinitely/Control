import { describe, expect, it } from "vitest";
import { formatEuro } from "@/lib/budget";
import { buildMonthBudgetPrompt, merchantLabel, type MonthBudgetPromptSnapshot } from "./prompt";

function snapshot(overrides: Partial<MonthBudgetPromptSnapshot> = {}): MonthBudgetPromptSnapshot {
  return {
    monthLabel: "July 2026",
    monthKey: "2026-07",
    incomeCents: 300000,
    expenseCents: 120000,
    netCents: 180000,
    savingsRate: 60,
    mom: {
      incomeDeltaCents: 20000,
      expenseDeltaCents: -5000,
      netDeltaCents: 25000,
      savingsRateDelta: 4,
    },
    breakdown: [
      { categoryId: "food", name: "Food", totalCents: 80000 },
      { categoryId: "transport", name: "Transport", totalCents: 40000 },
    ],
    merchants: [{ merchantKey: "K-MARKET", label: "K-MARKET KALLIO", totalCents: 4520, count: 2 }],
    uncategorizedCount: 0,
    entries: [
      {
        date: new Date(2026, 6, 20),
        type: "expense",
        amountCents: 40000,
        categoryName: "Transport",
        merchantKey: "HSL",
        rawDescription: "HSL TICKET",
        note: null,
      },
      {
        date: new Date(2026, 6, 3),
        type: "income",
        amountCents: 300000,
        categoryName: "Salary",
        merchantKey: "ACME OY",
        rawDescription: "Salary July",
        note: null,
      },
      {
        date: new Date(2026, 6, 8),
        type: "expense",
        amountCents: 80000,
        categoryName: "Food",
        merchantKey: "K-MARKET",
        rawDescription: "K-MARKET KALLIO",
        note: null,
      },
    ],
    ...overrides,
  };
}

describe("merchantLabel", () => {
  it("prefers raw description, then note, then merchant key", () => {
    expect(
      merchantLabel({ rawDescription: "K-MARKET", note: "ignored", merchantKey: "KEY" })
    ).toBe("K-MARKET");
    expect(merchantLabel({ rawDescription: null, note: "Lunch", merchantKey: "KEY" })).toBe("Lunch");
    expect(merchantLabel({ rawDescription: null, note: null, merchantKey: "HSL" })).toBe("HSL");
    expect(merchantLabel({ rawDescription: "  ", note: null, merchantKey: null })).toBe("Unknown");
  });
});

describe("buildMonthBudgetPrompt", () => {
  it("includes the analysis ask, month label, categories, and euro amounts", () => {
    const text = buildMonthBudgetPrompt(snapshot());
    expect(text).toContain("You are a personal finance coach");
    expect(text).toContain("Do not invent transactions");
    expect(text).toContain("Suggested monthly category caps");
    expect(text).toContain("July 2026 (2026-07)");
    expect(text).toContain("Food");
    expect(text).toContain("Transport");
    expect(text).toContain("Salary");
    expect(text).toContain(formatEuro(300000));
    expect(text).toContain(formatEuro(120000));
    expect(text).toContain(formatEuro(80000));
    expect(text).toContain("K-MARKET KALLIO");
  });

  it("warns when transactions are still uncategorized", () => {
    const withWarning = buildMonthBudgetPrompt(snapshot({ uncategorizedCount: 3 }));
    expect(withWarning).toContain("WARNING: 3 transactions this month are still uncategorized.");
    const without = buildMonthBudgetPrompt(snapshot({ uncategorizedCount: 0 }));
    expect(without).not.toContain("WARNING:");
  });

  it("lists transactions in chronological order", () => {
    const text = buildMonthBudgetPrompt(snapshot());
    const block = text.split("## Transactions\n")[1];
    const dates = [...block.matchAll(/^(\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]);
    expect(dates).toEqual(["2026-07-03", "2026-07-08", "2026-07-20"]);
  });

  it("includes month-over-month when provided", () => {
    const text = buildMonthBudgetPrompt(snapshot());
    expect(text).toContain("## vs previous month");
    expect(text).toContain("+4 pts");
  });
});
