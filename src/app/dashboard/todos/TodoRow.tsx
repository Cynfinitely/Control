"use client";

import clsx from "clsx";
import CheckButton from "@/components/CheckButton";
import IconButton from "@/components/IconButton";
import { formatDate, startOfDay } from "@/lib/date";
import { parseTimeSlot, TIME_SLOTS } from "@/lib/todo-meta";
import type { TodoItem } from "@/lib/queries/todos";
import MoveMenu, { type RowReorder } from "./MoveMenu";
import TodoEditForm, { type TodoPatch } from "./TodoEditForm";

export type { MoveTarget } from "./MoveMenu";

const PRIORITY: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "badge-danger" },
  medium: { label: "Medium", className: "badge-muted" },
  low: { label: "Low", className: "badge-muted" },
};

/** Badges shared by day rows and backlog rows. */
export function TodoBadges({
  todo,
  showSlot = true,
}: {
  todo: TodoItem;
  showSlot?: boolean;
}) {
  const isDone = todo.status === "done";
  const isOverdue =
    !isDone && todo.dueDate && new Date(todo.dueDate) < startOfDay(new Date());
  const priority = PRIORITY[todo.priority] ?? PRIORITY.medium;
  const slot = parseTimeSlot(todo.timeSlot);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {todo.priority !== "medium" && (
        <span className={priority.className}>
          <span className="sr-only">Priority: </span>
          {priority.label}
        </span>
      )}
      {showSlot && slot && (
        <span className="badge-warning">
          <span className="sr-only">When: </span>
          {TIME_SLOTS[slot]}
        </span>
      )}
      {todo.category && (
        <span className="badge-brand">
          <span className="sr-only">Category: </span>#{todo.category}
        </span>
      )}
      {todo.dueDate && (
        <span
          className={clsx(
            "text-xs",
            isOverdue
              ? "font-medium text-red-700 dark:text-red-400"
              : "text-muted"
          )}
        >
          Due {formatDate(todo.dueDate)}
          {isOverdue ? " · overdue" : ""}
        </span>
      )}
    </div>
  );
}

export type RowEditing = {
  active: boolean;
  categories: readonly string[];
  onStart: (id: string) => void;
  onSave: (id: string, patch: TodoPatch) => void;
  onCancel: () => void;
};

export default function TodoRow({
  todo,
  showBacklog,
  compact,
  onToggle,
  onDelete,
  onBacklog,
  editing,
  showSlot = true,
  reorder,
  rowRef,
  style,
  isDragging,
  pending,
}: {
  todo: TodoItem;
  showBacklog?: boolean;
  compact?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onBacklog: (id: string) => void;
  /** Inline editing; omitted in compact mode. */
  editing?: RowEditing;
  /** Hide the slot badge when rows are already grouped by slot. */
  showSlot?: boolean;
  /** Set in custom order. */
  reorder?: RowReorder;
  rowRef?: (element: HTMLLIElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  pending: boolean;
}) {
  const isDone = todo.status === "done";

  if (editing?.active) {
    return (
      <li
        ref={rowRef}
        style={style}
        className={clsx(
          "bg-brand-50/40 px-4 py-3 dark:bg-brand-950/20",
          reorder && "relative first:rounded-t-xl last:rounded-b-xl"
        )}
      >
        <TodoEditForm
          todo={todo}
          categories={editing.categories}
          onSave={patch => editing.onSave(todo.id, patch)}
          onCancel={editing.onCancel}
        />
      </li>
    );
  }

  return (
    <li
      ref={rowRef}
      style={style}
      className={clsx(
        "group flex items-center gap-3",
        compact ? "py-2" : "px-4 py-3",
        reorder &&
          "relative bg-white first:rounded-t-xl last:rounded-b-xl dark:bg-slate-800",
        isDragging &&
          "z-10 rounded-lg shadow-lg ring-1 ring-brand-500/40 dark:ring-brand-400/40"
      )}
    >
      {reorder?.handle}
      <CheckButton
        checked={isDone}
        disabled={pending}
        onChange={() => onToggle(todo.id)}
        label={
          isDone ? `Mark “${todo.title}” not done` : `Mark “${todo.title}” done`
        }
      />
      {reorder && (
        <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-muted">
          {reorder.rank}.
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          onDoubleClick={editing ? () => editing.onStart(todo.id) : undefined}
          title={editing ? "Double-click to edit" : undefined}
          className={clsx(
            "break-words",
            compact && "text-sm",
            isDone
              ? "text-muted line-through"
              : "font-medium text-slate-800 dark:text-slate-100"
          )}
        >
          {todo.title}
        </p>
        {!compact && <TodoBadges todo={todo} showSlot={showSlot} />}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {editing && (
          <IconButton
            icon="pencil"
            disabled={pending}
            onClick={() => editing.onStart(todo.id)}
            aria-label={`Edit “${todo.title}”`}
            className="sm:opacity-60 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          />
        )}
        {reorder && <MoveMenu todo={todo} reorder={reorder} />}
        {showBacklog && !isDone && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onBacklog(todo.id)}
            className="btn-ghost btn-sm min-h-[40px]"
            aria-label={`Move “${todo.title}” to backlog`}
          >
            Backlog
          </button>
        )}
        {!compact && (
          <IconButton
            icon="trash"
            tone="danger"
            disabled={pending}
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete “${todo.title}”`}
          />
        )}
      </div>
    </li>
  );
}
