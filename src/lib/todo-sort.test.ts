import { describe, expect, it } from "vitest";
import { applyOrder, moveIdTo, parseTodoSort, sortTodos } from "./todo-sort";

function todo(
  title: string,
  priority: string,
  created: string,
  due: string | null = null,
  position = 0
) {
  return {
    title,
    priority,
    createdAt: new Date(created),
    dueDate: due ? new Date(due) : null,
    position,
  };
}

const a = todo("banana", "medium", "2026-01-01", "2026-02-10");
const b = todo("Apple", "high", "2026-01-03");
const c = todo("cherry", "low", "2026-01-02", "2026-02-01");
const d = todo("date", "high", "2026-01-04", "2026-02-01");

const titles = (items: { title: string }[]) => items.map(t => t.title);

describe("sortTodos", () => {
  it("sorts by priority rank, then oldest first", () => {
    expect(titles(sortTodos([a, b, c, d], "priority"))).toEqual([
      "Apple",
      "date",
      "banana",
      "cherry",
    ]);
  });

  it("sorts by due date with undated todos last", () => {
    expect(titles(sortTodos([b, a, d, c], "due"))).toEqual([
      "cherry",
      "date",
      "banana",
      "Apple",
    ]);
  });

  it("sorts by creation time both ways", () => {
    expect(titles(sortTodos([a, b, c, d], "oldest"))).toEqual([
      "banana",
      "cherry",
      "Apple",
      "date",
    ]);
    expect(titles(sortTodos([a, b, c, d], "newest"))).toEqual([
      "date",
      "Apple",
      "cherry",
      "banana",
    ]);
  });

  it("sorts titles case-insensitively", () => {
    expect(titles(sortTodos([c, a, d, b], "title"))).toEqual([
      "Apple",
      "banana",
      "cherry",
      "date",
    ]);
  });

  it("sorts by custom position, then oldest first", () => {
    const first = todo("first", "low", "2026-01-05", null, 0);
    const second = todo("second", "high", "2026-01-01", null, 1);
    const unplaced = todo("unplaced", "high", "2026-01-02");
    expect(titles(sortTodos([second, unplaced, first], "custom"))).toEqual([
      "unplaced",
      "first",
      "second",
    ]);
  });

  it("does not mutate the input", () => {
    const input = [a, b];
    sortTodos(input, "title");
    expect(input).toEqual([a, b]);
  });
});

describe("parseTodoSort", () => {
  it("falls back to priority for missing or unknown values", () => {
    expect(parseTodoSort(null)).toBe("priority");
    expect(parseTodoSort("bogus")).toBe("priority");
    expect(parseTodoSort("toString")).toBe("priority");
    expect(parseTodoSort("due")).toBe("due");
  });
});

describe("moveIdTo", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("moves an id any distance in one step", () => {
    expect(moveIdTo(ids, "e", 0)).toEqual(["e", "a", "b", "c", "d"]);
    expect(moveIdTo(ids, "a", 4)).toEqual(["b", "c", "d", "e", "a"]);
    expect(moveIdTo(ids, "d", 1)).toEqual(["a", "d", "b", "c", "e"]);
    expect(moveIdTo(ids, "b", 3)).toEqual(["a", "c", "d", "b", "e"]);
  });

  it("clamps out-of-range targets to the ends", () => {
    expect(moveIdTo(ids, "c", -5)).toEqual(["c", "a", "b", "d", "e"]);
    expect(moveIdTo(ids, "c", 99)).toEqual(["a", "b", "d", "e", "c"]);
  });

  it("returns the original list for no-op moves or unknown ids", () => {
    expect(moveIdTo(ids, "c", 2)).toBe(ids);
    expect(moveIdTo(ids, "z", 0)).toBe(ids);
  });
});

describe("applyOrder", () => {
  const items = ["a", "b", "c", "d"].map(id => ({ id }));
  const idsOf = (list: { id: string }[]) => list.map(t => t.id);

  it("orders todos by the given ids", () => {
    expect(idsOf(applyOrder(items, ["d", "b", "a", "c"]))).toEqual([
      "d",
      "b",
      "a",
      "c",
    ]);
  });

  it("appends todos missing from ids and ignores unknown ids", () => {
    expect(idsOf(applyOrder(items, ["c", "zz", "a"]))).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
  });

  it("returns the input unchanged without ids", () => {
    expect(applyOrder(items, null)).toBe(items);
  });
});
