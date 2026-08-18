import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { importFingerprint, normalizeMerchantKey, merchantKeyFromParts } from "./merchant";
import {
  parseNordeaAmount,
  parseNordeaCsv,
  parseNordeaDate,
  NordeaParseError,
} from "./nordea-csv";
import {
  computeMonthOverMonth,
  expenseBreakdownWithUncategorized,
  savingsSeriesByMonth,
  topMerchantsBySpend,
} from "./analysis";

const fixtures = join(__dirname, "fixtures");

describe("merchant helpers", () => {
  it("normalizes merchant keys", () => {
    expect(normalizeMerchantKey("  K-Market  Kallio ")).toBe("K-MARKET KALLIO");
  });

  it("builds stable fingerprints", () => {
    const d = new Date(2026, 6, 15);
    const a = importFingerprint(d, -4520, "K-MARKET KALLIO — OSTOS");
    const b = importFingerprint(d, -4520, "k-market  kallio — ostos");
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it("prefers payee for merchant key", () => {
    expect(merchantKeyFromParts("HSL", "ticket")).toBe("HSL");
    expect(merchantKeyFromParts("", "ticket")).toBe("TICKET");
  });
});

describe("nordea csv parser", () => {
  it("parses Finnish amounts and dates", () => {
    expect(parseNordeaAmount("-45,20")).toBe(-4520);
    expect(parseNordeaAmount("1.234,56")).toBe(123456);
    expect(parseNordeaAmount("0")).toBeNull();
    expect(parseNordeaDate("15.07.2026")?.getDate()).toBe(15);
    expect(parseNordeaDate("2026-07-15")?.getMonth()).toBe(6);
  });

  it("parses Finnish TSV fixture", () => {
    const content = readFileSync(join(fixtures, "nordea-fi-tsv.txt"), "utf8");
    const result = parseNordeaCsv(content);
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0].type).toBe("expense");
    expect(result.transactions[0].amountCents).toBe(4520);
    expect(result.transactions[0].merchantKey).toBe("K-MARKET KALLIO");
    expect(result.transactions[1].type).toBe("income");
    expect(result.transactions[1].amountCents).toBe(250000);
  });

  it("skips preamble and parses English CSV", () => {
    const content = readFileSync(join(fixtures, "nordea-en-csv.txt"), "utf8");
    const result = parseNordeaCsv(content);
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[1].amountCents).toBe(123456);
    expect(result.transactions[1].type).toBe("income");
  });

  it("rejects files without headers", () => {
    expect(() => parseNordeaCsv("foo,bar\n1,2")).toThrow(NordeaParseError);
  });
});

describe("budget analysis helpers", () => {
  const txs = [
    {
      type: "expense",
      amountCents: 3000,
      date: new Date("2026-07-10"),
      categoryId: "food",
      merchantKey: "K-MARKET",
      rawDescription: "K-Market",
      deletedAt: null,
    },
    {
      type: "expense",
      amountCents: 2000,
      date: new Date("2026-07-12"),
      categoryId: undefined,
      merchantKey: "HSL",
      rawDescription: "HSL",
      deletedAt: null,
    },
    {
      type: "income",
      amountCents: 10000,
      date: new Date("2026-07-01"),
      categoryId: "salary",
      deletedAt: null,
    },
    {
      type: "expense",
      amountCents: 1000,
      date: new Date("2026-06-15"),
      categoryId: "food",
      merchantKey: "K-MARKET",
      deletedAt: null,
    },
  ];

  it("includes uncategorized in breakdown", () => {
    const rows = expenseBreakdownWithUncategorized(
      txs,
      [{ id: "food", name: "Food" }],
      new Date("2026-07-01"),
      new Date("2026-07-31")
    );
    expect(rows.find((r) => r.name === "Uncategorized")?.totalCents).toBe(2000);
    expect(rows.find((r) => r.name === "Food")?.totalCents).toBe(3000);
  });

  it("ranks top merchants", () => {
    const top = topMerchantsBySpend(txs, new Date("2026-07-01"), new Date("2026-07-31"));
    expect(top[0].merchantKey).toBe("K-MARKET");
    expect(top[0].totalCents).toBe(3000);
  });

  it("builds savings series and MoM", () => {
    const series = savingsSeriesByMonth(txs, ["2026-06", "2026-07"]);
    expect(series[1].incomeCents).toBe(10000);
    expect(series[1].expenseCents).toBe(5000);
    const mom = computeMonthOverMonth(
      { ...series[1], savingsRate: 50 },
      { ...series[0], savingsRate: null }
    );
    expect(mom?.expenseDeltaCents).toBe(4000);
    expect(mom?.savingsRateDelta).toBeNull();
  });
});
