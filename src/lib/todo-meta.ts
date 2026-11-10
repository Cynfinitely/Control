/** Shared todo vocabulary: time slots, priorities, categories and quick-add. */

export const TIME_SLOTS = {
  work: "Work",
  after: "After work",
} as const;

export type TimeSlot = keyof typeof TIME_SLOTS;

/** Label for a todo with no slot. */
export const ANYTIME_LABEL = "Anytime";

export const PRIORITIES = {
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

export type Priority = keyof typeof PRIORITIES;

export const DEFAULT_CATEGORIES = [
  "work",
  "personal",
  "health",
  "home",
  "errands",
] as const;

export const MAX_TITLE_LENGTH = 200;
export const MAX_CATEGORY_LENGTH = 40;

export function parseTimeSlot(value: unknown): TimeSlot | null {
  return typeof value === "string" && Object.hasOwn(TIME_SLOTS, value)
    ? (value as TimeSlot)
    : null;
}

export function parsePriority(value: unknown): Priority {
  return typeof value === "string" && Object.hasOwn(PRIORITIES, value)
    ? (value as Priority)
    : "medium";
}

export function slotLabel(slot: string | null | undefined): string {
  const parsed = parseTimeSlot(slot);
  return parsed ? TIME_SLOTS[parsed] : ANYTIME_LABEL;
}

/** Trims, lowercases and caps a category; empty becomes null. */
export function normalizeCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase().slice(0, MAX_CATEGORY_LENGTH);
  return trimmed || null;
}

/** The user's own categories first, then the defaults, without duplicates. */
export function mergeCategories(
  userCategories: readonly string[],
  defaults: readonly string[] = DEFAULT_CATEGORIES
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const raw of [...userCategories, ...defaults]) {
    const category = normalizeCategory(raw);
    if (!category || seen.has(category)) continue;
    seen.add(category);
    merged.push(category);
  }
  return merged;
}

const PRIORITY_TOKENS: Record<string, Priority> = {
  "!high": "high",
  "!h": "high",
  "!medium": "medium",
  "!med": "medium",
  "!m": "medium",
  "!low": "low",
  "!l": "low",
};

const SLOT_TOKENS: Record<string, TimeSlot | "anytime"> = {
  "@work": "work",
  "@after": "after",
  "@afterwork": "after",
  "@any": "anytime",
  "@anytime": "anytime",
};

export type QuickAdd = {
  title: string;
  priority?: Priority;
  category?: string;
  /** null means the user typed @any to clear the slot. */
  timeSlot?: TimeSlot | null;
};

/**
 * Pulls shortcut tokens out of a typed title: `!high`, `#category`, `@after`.
 * Only whole whitespace-separated tokens count, so "C#" or "a@b.com" stay in
 * the title. The last token of each kind wins. If nothing but tokens was
 * typed, the raw text is kept as the title.
 */
export function parseQuickAdd(raw: string): QuickAdd {
  const result: QuickAdd = { title: "" };
  const words: string[] = [];
  for (const word of raw.trim().split(/\s+/)) {
    const lower = word.toLowerCase();
    if (Object.hasOwn(PRIORITY_TOKENS, lower)) {
      result.priority = PRIORITY_TOKENS[lower];
    } else if (Object.hasOwn(SLOT_TOKENS, lower)) {
      const slot = SLOT_TOKENS[lower];
      result.timeSlot = slot === "anytime" ? null : slot;
    } else if (/^#[\p{L}\p{N}_-]+$/u.test(word)) {
      result.category = normalizeCategory(word.slice(1)) ?? undefined;
    } else if (word) {
      words.push(word);
    }
  }
  result.title = words.length > 0 ? words.join(" ") : raw.trim();
  if (words.length === 0) return { title: result.title };
  return result;
}

export type SlotGroup<T> = {
  key: TimeSlot | "anytime";
  label: string;
  items: T[];
};

/** Splits todos into Work, After work and Anytime, dropping empty groups. */
export function groupBySlot<T extends { timeSlot: string | null }>(
  todos: readonly T[]
): SlotGroup<T>[] {
  const groups: SlotGroup<T>[] = [
    { key: "work", label: TIME_SLOTS.work, items: [] },
    { key: "after", label: TIME_SLOTS.after, items: [] },
    { key: "anytime", label: ANYTIME_LABEL, items: [] },
  ];
  for (const todo of todos) {
    const slot = parseTimeSlot(todo.timeSlot);
    groups[slot === "work" ? 0 : slot === "after" ? 1 : 2].items.push(todo);
  }
  return groups.filter(g => g.items.length > 0);
}

export type TodoFilter =
  | { kind: "all" }
  | { kind: "slot"; slot: TimeSlot | "anytime" }
  | { kind: "category"; category: string };

/** Filters persist as strings like "slot:after" or "category:health". */
export function parseTodoFilter(value: string | null | undefined): TodoFilter {
  if (!value) return { kind: "all" };
  const [kind, ...rest] = value.split(":");
  const arg = rest.join(":");
  if (kind === "slot" && (arg === "anytime" || parseTimeSlot(arg))) {
    return { kind: "slot", slot: arg as TimeSlot | "anytime" };
  }
  if (kind === "category" && arg) return { kind: "category", category: arg };
  return { kind: "all" };
}

export function serializeTodoFilter(filter: TodoFilter): string {
  switch (filter.kind) {
    case "all":
      return "all";
    case "slot":
      return `slot:${filter.slot}`;
    case "category":
      return `category:${filter.category}`;
  }
}

export function matchesFilter(
  todo: { timeSlot: string | null; category: string | null },
  filter: TodoFilter
): boolean {
  switch (filter.kind) {
    case "all":
      return true;
    case "slot":
      return (parseTimeSlot(todo.timeSlot) ?? "anytime") === filter.slot;
    case "category":
      return normalizeCategory(todo.category) === filter.category;
  }
}
