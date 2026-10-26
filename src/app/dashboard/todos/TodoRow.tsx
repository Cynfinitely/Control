"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import CheckButton from "@/components/CheckButton";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import { formatDate, startOfDay } from "@/lib/date";
import type { TodoItem } from "@/lib/queries/todos";

const PRIORITY: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "badge-danger" },
  medium: { label: "Medium", className: "badge-muted" },
  low: { label: "Low", className: "badge-muted" },
};

export type MoveTarget = "top" | "bottom";

/** Custom-order controls: the row's 1-based rank, drag handle and move menu. */
type RowReorder = {
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveTo: (id: string, target: MoveTarget) => void;
  /** The dnd-kit drag handle, rendered at the start of the row. */
  handle: React.ReactNode;
};

/** "⋮" menu with Move to top / Move to bottom. */
function MoveMenu({ todo, reorder }: { todo: TodoItem; reorder: RowReorder }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>("button:enabled")
      ?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      )
        setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function choose(target: MoveTarget) {
    setOpen(false);
    reorder.onMoveTo(todo.id, target);
  }

  const items: { target: MoveTarget; label: string; icon: string }[] = [
    { target: "top", label: "Move to top", icon: "arrowUpToLine" },
    { target: "bottom", label: "Move to bottom", icon: "arrowDownToLine" },
  ];

  return (
    <div className="relative">
      <IconButton
        ref={buttonRef}
        icon="moreVertical"
        aria-label={`Move options for “${todo.title}”`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      />
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {items.map(item => (
            <button
              key={item.target}
              type="button"
              role="menuitem"
              disabled={
                item.target === "top" ? reorder.isFirst : reorder.isLast
              }
              onClick={() => choose(item.target)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:bg-slate-700"
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TodoRow({
  todo,
  showBacklog,
  compact,
  onToggle,
  onDelete,
  onBacklog,
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
  /** Set in custom order. */
  reorder?: RowReorder;
  rowRef?: (element: HTMLLIElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  pending: boolean;
}) {
  const isDone = todo.status === "done";
  const isOverdue =
    !isDone && todo.dueDate && new Date(todo.dueDate) < startOfDay(new Date());
  const priority = PRIORITY[todo.priority] ?? PRIORITY.medium;

  return (
    <li
      ref={rowRef}
      style={style}
      className={clsx(
        "flex items-center gap-3",
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
        {!compact && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={priority.className}>
              <span className="sr-only">Priority: </span>
              {priority.label}
            </span>
            {todo.category && (
              <span className="badge-brand">{todo.category}</span>
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
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
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
