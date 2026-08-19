import { formatEuro, formatEuroSigned, type CategoryBreakdown } from "@/lib/budget";
import { toDateInputValue } from "@/lib/date";
import type { MerchantSpend, MonthOverMonth } from "@/lib/budget/analysis";

export type MonthBudgetPromptEntry = {
  date: Date;
  type: string;
  amountCents: number;
  categoryName: string;
  merchantKey: string | null;
  rawDescription: string | null;
  note: string | null;
};

export type MonthBudgetPromptSnapshot = {
  monthLabel: string;
  monthKey: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  savingsRate: number | null;
  mom: MonthOverMonth | null;
  breakdown: CategoryBreakdown[];
  merchants: MerchantSpend[];
  uncategorizedCount: number;
  entries: MonthBudgetPromptEntry[];
};

export function merchantLabel(entry: Pick<MonthBudgetPromptEntry, "rawDescription" | "note" | "merchantKey">): string {
  return (entry.rawDescription || entry.note || entry.merchantKey || "").trim() || "Unknown";
}

function percentOf(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function formatDelta(cents: number): string {
  const sign = cents > 0 ? "+" : "";
  return `${sign}${formatEuro(cents)}`;
}

function incomeBreakdown(entries: MonthBudgetPromptEntry[]): CategoryBreakdown[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== "income") continue;
    const name = entry.categoryName || "Uncategorized";
    totals.set(name, (totals.get(name) ?? 0) + entry.amountCents);
  }
  return [...totals.entries()]
    .map(([name, totalCents]) => ({ categoryId: name, name, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

function sortedEntries(entries: MonthBudgetPromptEntry[]): MonthBudgetPromptEntry[] {
  return [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function buildMonthBudgetPrompt(snapshot: MonthBudgetPromptSnapshot): string {
  const lines: string[] = [];

  lines.push(
    "You are a personal finance coach. Analyze this one month of categorized bank transactions (EUR) and suggest concrete budget improvements.",
    "",
    "Constraints:",
    "- Currency is EUR",
    "- This is historical actual spending, not a planned budget",
    "- Do not invent transactions",
    "- Treat uncategorized rows as incomplete data",
    "",
    "Please provide:",
    "1. A 5–8 sentence snapshot of the month",
    "2. Category-by-category notes",
    "3. Suggested monthly category caps for next month based on this month",
    "4. 3–7 specific cut/save actions with euro amounts",
    "5. Anything that looks like a subscription or spending leak",
    "",
    `## Month`,
    `${snapshot.monthLabel} (${snapshot.monthKey})`,
    ""
  );

  if (snapshot.uncategorizedCount > 0) {
    lines.push(
      `WARNING: ${snapshot.uncategorizedCount} transaction${
        snapshot.uncategorizedCount === 1 ? "" : "s"
      } this month ${snapshot.uncategorizedCount === 1 ? "is" : "are"} still uncategorized.`,
      ""
    );
  }

  lines.push(
    "## Totals",
    `- Income: ${formatEuro(snapshot.incomeCents)}`,
    `- Expenses: ${formatEuro(snapshot.expenseCents)}`,
    `- Net: ${formatEuroSigned(snapshot.netCents)}`,
    `- Savings rate: ${snapshot.savingsRate === null ? "—" : `${snapshot.savingsRate}%`}`,
    ""
  );

  if (snapshot.mom) {
    const savingsDelta =
      snapshot.mom.savingsRateDelta === null
        ? "—"
        : `${snapshot.mom.savingsRateDelta > 0 ? "+" : ""}${snapshot.mom.savingsRateDelta} pts`;
    lines.push(
      "## vs previous month",
      `- Income: ${formatDelta(snapshot.mom.incomeDeltaCents)}`,
      `- Expenses: ${formatDelta(snapshot.mom.expenseDeltaCents)}`,
      `- Net: ${formatDelta(snapshot.mom.netDeltaCents)}`,
      `- Savings rate: ${savingsDelta}`,
      ""
    );
  }

  lines.push("## Spending by category");
  if (snapshot.breakdown.length === 0) {
    lines.push("- None");
  } else {
    for (const row of snapshot.breakdown) {
      lines.push(
        `- ${row.name}: ${formatEuro(row.totalCents)} (${percentOf(row.totalCents, snapshot.expenseCents)} of expenses)`
      );
    }
  }
  lines.push("");

  const incomeRows = incomeBreakdown(snapshot.entries);
  lines.push("## Income by category");
  if (incomeRows.length === 0) {
    lines.push("- None");
  } else {
    for (const row of incomeRows) {
      lines.push(
        `- ${row.name}: ${formatEuro(row.totalCents)} (${percentOf(row.totalCents, snapshot.incomeCents)} of income)`
      );
    }
  }
  lines.push("");

  lines.push("## Top merchants");
  if (snapshot.merchants.length === 0) {
    lines.push("- None");
  } else {
    for (const merchant of snapshot.merchants) {
      lines.push(
        `- ${merchant.label}: ${formatEuro(merchant.totalCents)} (${merchant.count} transaction${
          merchant.count === 1 ? "" : "s"
        })`
      );
    }
  }
  lines.push("");

  lines.push("## Transactions");
  const entries = sortedEntries(snapshot.entries);
  if (entries.length === 0) {
    lines.push("- None");
  } else {
    for (const entry of entries) {
      lines.push(
        `${toDateInputValue(entry.date)} | ${entry.type} | ${formatEuro(entry.amountCents)} | ${
          entry.categoryName
        } | ${merchantLabel(entry)}`
      );
    }
  }

  return lines.join("\n");
}
