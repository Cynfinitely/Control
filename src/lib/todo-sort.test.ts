import { describe, expect, it } from "vitest";
import { moveId, parseTodoSort, sortTodos } from "./todo-sort";

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

describe("moveId", () => {
  const ids = ["a", "b", "c"];

  it("swaps with the neighbour in the given direction", () => {
    expect(moveId(ids, "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveId(ids, "b", 1)).toEqual(["a", "c", "b"]);
  });

  it("leaves the list unchanged at the edges or for unknown ids", () => {
    expect(moveId(ids, "a", -1)).toBe(ids);
    expect(moveId(ids, "c", 1)).toBe(ids);
    expect(moveId(ids, "z", 1)).toBe(ids);
  });
});
