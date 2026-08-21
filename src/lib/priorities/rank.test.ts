import { describe, expect, it } from "vitest";
import { MAX_LIFE_PRIORITIES, neighborForMove } from "./rank";

const items = [
  { id: "religion", sortOrder: 0 },
  { id: "health", sortOrder: 1 },
  { id: "family", sortOrder: 2 },
];

describe("neighborForMove", () => {
  it("returns the previous item when moving up", () => {
    expect(neighborForMove(items, "health", "up")).toEqual({ id: "religion", sortOrder: 0 });
  });

  it("returns the next item when moving down", () => {
    expect(neighborForMove(items, "health", "down")).toEqual({ id: "family", sortOrder: 2 });
  });

  it("returns null when the first item moves up", () => {
    expect(neighborForMove(items, "religion", "up")).toBeNull();
  });

  it("returns null when the last item moves down", () => {
    expect(neighborForMove(items, "family", "down")).toBeNull();
  });

  it("returns null for an unknown id", () => {
    expect(neighborForMove(items, "career", "up")).toBeNull();
  });

  it("sorts by sortOrder before picking a neighbor", () => {
    const unsorted = [
      { id: "family", sortOrder: 2 },
      { id: "religion", sortOrder: 0 },
      { id: "health", sortOrder: 1 },
    ];
    expect(neighborForMove(unsorted, "religion", "down")).toEqual({ id: "health", sortOrder: 1 });
  });
});

describe("MAX_LIFE_PRIORITIES", () => {
  it("caps the list at 12", () => {
    expect(MAX_LIFE_PRIORITIES).toBe(12);
  });
});
