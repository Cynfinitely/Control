"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import CheckButton from "@/components/CheckButton";
import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";
import { formatDate, startOfDay } from "@/lib/date";
import CollapsibleSection from "@/components/CollapsibleSection";
import { toggleTodo, deleteTodo, moveToBacklog, restoreTodo } from "./actions";
import type { TodoItem } from "@/lib/queries/todos";

type Props = {
  initialTodos: TodoItem[];
  compact?: boolean;
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "backlog"; id: string };

const PRIORITY: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "badge-danger" },
  medium: { label: "Medium", className: "badge-muted" },
  low: { label: "Low", className: "badge-muted" },
};

function applyOptimistic(todos: TodoItem[], action: OptimisticAction): TodoItem[] {
  switch (action.type) {
    case "toggle":
      return todos.map((t) =>
        t.id === action.id ? { ...t, status: t.status === "done" ? "open" : "done" } : t
      );
    case "delete":
    case "backlog":
      return todos.filter((t) => t.id !== action.id);
  }
}

function TodoRow({
  todo,
  showBacklog,
  compact,
  onToggle,
  onDelete,
  onBacklog,
  pending,
}: {
  todo: TodoItem;
  showBacklog?: boolean;
  compact?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onBacklog: (id: string) => void;
  pending: boolean;
}) {
  const isDone = todo.status === "done";
  const isOverdue =
    !isDone && todo.dueDate && new Date(todo.dueDate) < startOfDay(new Date());
  const priority = PRIORITY[todo.priority] ?? PRIORITY.medium;

  return (
    <li className={clsx("flex items-center gap-3", compact ? "py-2" : "px-4 py-3")}>
      <CheckButton
        checked={isDone}
        disabled={pending}
        onChange={() => onToggle(todo.id)}
        label={isDone ? `Mark “${todo.title}” not done` : `Mark “${todo.title}” done`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "break-words",
            compact && "text-sm",
            isDone ? "text-muted line-through" : "font-medium text-slate-800 dark:text-slate-100"
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
            {todo.category && <span className="badge-brand">{todo.category}</span>}
            {todo.dueDate && (
              <span
                className={clsx(
                  "text-xs",
                  isOverdue ? "font-medium text-red-700 dark:text-red-400" : "text-muted"
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

export default function TodoList({ initialTodos, compact = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, updateOptimistic] = useOptimistic(initialTodos, applyOptimistic);
  const router = useRouter();
  const { success, error } = useToast();

  function runAction(
    action: OptimisticAction,
    fn: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    after?: { message: string; undo?: () => void }
  ) {
    startTransition(async () => {
      updateOptimistic(action);
      let result: { ok: boolean; error?: string };
      try {
        result = await fn();
      } catch {
        result = { ok: false };
      }
      if (!result.ok) {
        error(result.error ?? "Couldn't save — try again");
        router.refresh();
        return;
      }
      if (after) {
        success(after.message, after.undo ? { label: "Undo", onClick: after.undo } : undefined);
      }
    });
  }

  function handleToggle(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "toggle", id }, () => toggleTodo(fd));
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "delete", id }, () => deleteTodo(fd), {
      message: "Todo deleted",
      undo: () => {
        const restoreFd = new FormData();
        restoreFd.set("id", id);
        startTransition(async () => {
          const res = await restoreTodo(restoreFd);
          router.refresh();
          if (res.ok) success("Todo restored");
          else error(res.error);
        });
      },
    });
  }

  function handleBacklog(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "backlog", id }, () => moveToBacklog(fd), { message: "Moved to backlog" });
  }

  const open = optimisticTodos.filter((t) => t.status === "open");
  const done = optimisticTodos.filter((t) => t.status === "done");

  const renderRows = (items: TodoItem[]) =>
    items.map((t) => (
      <TodoRow
        key={t.id}
        todo={t}
        showBacklog={!compact}
        compact={compact}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onBacklog={handleBacklog}
        pending={isPending}
      />
    ));

  if (compact) {
    if (optimisticTodos.length === 0) return null;
    return (
      <div className={clsx("relative", isPending && "opacity-80")}>
        <PendingIndicator pending={isPending} />
        <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-700 dark:border-slate-700">
          {renderRows([...open, ...done])}
        </ul>
      </div>
    );
  }

  return (
    <div className={clsx("relative", isPending && "opacity-80")}>
      <PendingIndicator pending={isPending} />
      {optimisticTodos.length === 0 && (
        <EmptyState
          icon="check"
          title="Your day is clear"
          description="No todos for this day. Add one above to get started."
        />
      )}
      <div className="space-y-4">
        {open.length > 0 && (
          <CollapsibleSection title="Open" count={open.length} defaultOpen as="h2">
            <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">{renderRows(open)}</ul>
          </CollapsibleSection>
        )}
        {done.length > 0 && (
          <CollapsibleSection title="Done" count={done.length} as="h2">
            <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">{renderRows(done)}</ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
