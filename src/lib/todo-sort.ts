export const TODO_SORTS = {
  priority: "Priority",
  custom: "Custom order",
  due: "Due date",
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title (A–Z)",
} as const;

export type TodoSort = keyof typeof TODO_SORTS;

export const DEFAULT_TODO_SORT: TodoSort = "priority";

export function parseTodoSort(value: string | null | undefined): TodoSort {
  return value && Object.hasOwn(TODO_SORTS, value)
    ? (value as TodoSort)
    : DEFAULT_TODO_SORT;
}

type Sortable = {
  title: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  position: number;
};

// Priority is stored as a string, so alphabetical ordering would put
// "medium" before "high". Rank it explicitly; unknown values sort as medium.
const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function priorityRank(priority: string) {
  return PRIORITY_RANK[priority] ?? PRIORITY_RANK.medium;
}

function byCreated(a: Sortable, b: Sortable) {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

const COMPARATORS: Record<TodoSort, (a: Sortable, b: Sortable) => number> = {
  priority: (a, b) =>
    priorityRank(a.priority) - priorityRank(b.priority) || byCreated(a, b),
  // Soonest due first; todos without a due date go last.
  due: (a, b) => {
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime() || byCreated(a, b);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return byCreated(a, b);
  },
  // Todos never reordered share position 0 and fall back to creation order.
  custom: (a, b) => a.position - b.position || byCreated(a, b),
  newest: (a, b) => byCreated(b, a),
  oldest: byCreated,
  title: (a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) ||
    byCreated(a, b),
};

/** Returns a sorted copy; the input array is left untouched. */
export function sortTodos<T extends Sortable>(todos: T[], sort: TodoSort): T[] {
  return [...todos].sort(COMPARATORS[sort]);
}

/**
 * Moves `id` to `toIndex` in `ids` (clamped to the list), shifting the rest.
 * Returns a new array, or the original for an unknown id or a no-op move.
 */
export function moveIdTo(ids: string[], id: string, toIndex: number): string[] {
  const from = ids.indexOf(id);
  const to = Math.min(Math.max(toIndex, 0), ids.length - 1);
  if (from === -1 || from === to) return ids;
  const next = ids.filter(other => other !== id);
  next.splice(to, 0, id);
  return next;
}

/**
 * Puts todos listed in `ids` first, in that order. Todos not in `ids` (added or
 * reopened since the order was set) keep their incoming order after them.
 * Returns the input unchanged when `ids` is null.
 */
export function applyOrder<T extends { id: string }>(
  todos: T[],
  ids: string[] | null
): T[] {
  if (!ids) return todos;
  const rank = new Map(ids.map((id, index) => [id, index]));
  const ranked = todos.filter(t => rank.has(t.id));
  ranked.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  return [...ranked, ...todos.filter(t => !rank.has(t.id))];
}
