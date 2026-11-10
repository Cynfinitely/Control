import { describe, expect, it } from "vitest";
import {
  groupBySlot,
  matchesFilter,
  mergeCategories,
  normalizeCategory,
  parsePriority,
  parseQuickAdd,
  parseTimeSlot,
  parseTodoFilter,
  serializeTodoFilter,
  slotLabel,
} from "./todo-meta";

describe("parseQuickAdd", () => {
  it("returns the title untouched when there are no tokens", () => {
    expect(parseQuickAdd("  Buy milk  ")).toEqual({ title: "Buy milk" });
  });

  it("extracts priority, category and slot tokens", () => {
    expect(parseQuickAdd("Buy milk #errands @after !high")).toEqual({
      title: "Buy milk",
      priority: "high",
      category: "errands",
      timeSlot: "after",
    });
  });

  it("accepts short and uppercase forms", () => {
    expect(parseQuickAdd("Call mom !L @WORK #Family")).toEqual({
      title: "Call mom",
      priority: "low",
      category: "family",
      timeSlot: "work",
    });
  });

  it("maps @any to a cleared slot", () => {
    expect(parseQuickAdd("Read @any").timeSlot).toBeNull();
  });

  it("lets the last token of each kind win", () => {
    const parsed = parseQuickAdd("Task !low #a #b !high");
    expect(parsed.priority).toBe("high");
    expect(parsed.category).toBe("b");
  });

  it("leaves tokens embedded in words alone", () => {
    expect(parseQuickAdd("Learn C# from a@b.com")).toEqual({
      title: "Learn C# from a@b.com",
    });
  });

  it("ignores unknown ! and @ words", () => {
    expect(parseQuickAdd("Wow !urgent @home")).toEqual({
      title: "Wow !urgent @home",
    });
  });

  it("keeps the raw text when only tokens were typed", () => {
    expect(parseQuickAdd("#health !high")).toEqual({
      title: "#health !high",
    });
  });
});

describe("groupBySlot", () => {
  it("orders groups Work, After work, Anytime and drops empty ones", () => {
    const todos = [
      { id: "1", timeSlot: null },
      { id: "2", timeSlot: "after" },
      { id: "3", timeSlot: "work" },
      { id: "4", timeSlot: "after" },
      { id: "5", timeSlot: "bogus" },
    ];
    const groups = groupBySlot(todos);
    expect(groups.map(g => g.key)).toEqual(["work", "after", "anytime"]);
    expect(groups[1].items.map(t => t.id)).toEqual(["2", "4"]);
    expect(groups[2].items.map(t => t.id)).toEqual(["1", "5"]);
    expect(groupBySlot([{ timeSlot: null }]).map(g => g.key)).toEqual([
      "anytime",
    ]);
  });
});

describe("mergeCategories", () => {
  it("puts user categories first and de-duplicates case-insensitively", () => {
    expect(
      mergeCategories([" Health ", "reading", "health"], ["work", "HEALTH"])
    ).toEqual(["health", "reading", "work"]);
  });
});

describe("parsers", () => {
  it("whitelists slots and priorities", () => {
    expect(parseTimeSlot("after")).toBe("after");
    expect(parseTimeSlot("constructor")).toBeNull();
    expect(parseTimeSlot(undefined)).toBeNull();
    expect(parsePriority("high")).toBe("high");
    expect(parsePriority("urgent")).toBe("medium");
    expect(slotLabel(null)).toBe("Anytime");
    expect(slotLabel("work")).toBe("Work");
  });

  it("normalizes categories", () => {
    expect(normalizeCategory("  Errands ")).toBe("errands");
    expect(normalizeCategory("   ")).toBeNull();
    expect(normalizeCategory("x".repeat(60))).toHaveLength(40);
  });
});

describe("todo filters", () => {
  const todo = { timeSlot: "after", category: "Health" };

  it("round-trips through the stored string", () => {
    for (const raw of ["all", "slot:after", "slot:anytime", "category:a:b"]) {
      expect(serializeTodoFilter(parseTodoFilter(raw))).toBe(raw);
    }
    expect(parseTodoFilter("slot:nope")).toEqual({ kind: "all" });
    expect(parseTodoFilter(null)).toEqual({ kind: "all" });
  });

  it("matches by slot and category", () => {
    expect(matchesFilter(todo, { kind: "all" })).toBe(true);
    expect(matchesFilter(todo, { kind: "slot", slot: "after" })).toBe(true);
    expect(matchesFilter(todo, { kind: "slot", slot: "anytime" })).toBe(false);
    expect(
      matchesFilter(
        { timeSlot: null, category: null },
        {
          kind: "slot",
          slot: "anytime",
        }
      )
    ).toBe(true);
    expect(matchesFilter(todo, { kind: "category", category: "health" })).toBe(
      true
    );
  });
});
