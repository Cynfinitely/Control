"use client";

import clsx from "clsx";
import { TODO_SORTS, type TodoSort } from "@/lib/todo-sort";
import {
  ANYTIME_LABEL,
  TIME_SLOTS,
  matchesFilter,
  normalizeCategory,
  parseTimeSlot,
  serializeTodoFilter,
  type TodoFilter,
} from "@/lib/todo-meta";
import type { TodoItem } from "@/lib/queries/todos";

type FilterOption = { filter: TodoFilter; label: string; count: number };

/** Filters worth offering for this day: slots in use, then categories. */
export function filterOptions(todos: readonly TodoItem[]): FilterOption[] {
  const options: FilterOption[] = [];
  const add = (filter: TodoFilter, label: string) => {
    const count = todos.filter(t => matchesFilter(t, filter)).length;
    if (count > 0) options.push({ filter, label, count });
  };
  if (todos.some(t => parseTimeSlot(t.timeSlot))) {
    add({ kind: "slot", slot: "work" }, TIME_SLOTS.work);
    add({ kind: "slot", slot: "after" }, TIME_SLOTS.after);
    add({ kind: "slot", slot: "anytime" }, ANYTIME_LABEL);
  }
  const categories = [
    ...new Set(todos.flatMap(t => normalizeCategory(t.category) ?? [])),
  ].sort();
  for (const category of categories) {
    add({ kind: "category", category }, `#${category}`);
  }
  return options;
}

type Props = {
  options: FilterOption[];
  filter: TodoFilter;
  onFilter: (filter: TodoFilter) => void;
  total: number;
  sort: TodoSort;
  onSort: (sort: TodoSort) => void;
};

/** Filter pills on the left, sort select on the right. */
export default function TodoToolbar({
  options,
  filter,
  onFilter,
  total,
  sort,
  onSort,
}: Props) {
  const active = serializeTodoFilter(filter);
  const pills: FilterOption[] =
    options.length > 0
      ? [{ filter: { kind: "all" }, label: "All", count: total }, ...options]
      : [];

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div
        role="group"
        aria-label="Filter todos"
        className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5"
      >
        {pills.map(p => {
          const key = serializeTodoFilter(p.filter);
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilter(p.filter)}
              className={clsx(
                "chip min-h-[32px] px-2.5 text-xs",
                isActive ? "chip-active" : "chip-idle"
              )}
            >
              {p.label}
              <span
                className={clsx(
                  "tabular-nums",
                  isActive ? "text-white/80" : "text-muted"
                )}
              >
                {p.count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="todo-sort" className="text-sm text-muted">
          Sort by
        </label>
        <select
          id="todo-sort"
          className="input w-auto"
          value={sort}
          onChange={e => onSort(e.target.value as TodoSort)}
        >
          {Object.entries(TODO_SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
