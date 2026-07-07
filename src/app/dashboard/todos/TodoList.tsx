"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { useToast } from "@/components/Toast";
import { formatDate } from "@/lib/date";
import { toggleTodo, deleteTodo, moveToBacklog, restoreTodo } from "./actions";
import type { TodoItem } from "@/lib/queries/todos";

type Props = {
  initialTodos: TodoItem[];
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "backlog"; id: string };

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-slate-100 text-slate-500",
  low: "bg-blue-50 text-blue-600",
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
  onToggle,
  onDelete,
  onBacklog,
  pending,
}: {
  todo: TodoItem;
  showBacklog?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onBacklog: (id: string) => void;
  pending: boolean;
}) {
  const isDone = todo.status === "done";
  const isOverdue =
    !isDone && todo.dueDate && new Date(todo.dueDate) < new Date(new Date().toDateString());

  return (
    <div className={`card flex items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => onToggle(todo.id)}
        className={`touch-target flex h-6 w-6 shrink-0 items-center justify-center rounded border disabled:opacity-50 ${
          isDone
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 hover:border-brand-500 dark:border-slate-600"
        }`}
        aria-label={isDone ? "Mark open" : "Mark done"}
      >
        {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`${isDone ? "text-slate-500 line-through" : "font-medium text-slate-800 dark:text-slate-100"}`}>
          {todo.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className={`badge text-xs ${PRIORITY_STYLE[todo.priority] ?? PRIORITY_STYLE.medium}`}>
            {todo.priority}
          </span>
          {todo.category && (
            <span className="badge bg-violet-50 text-xs text-violet-600">{todo.category}</span>
          )}
          {todo.dueDate && (
            <span className={`text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-400"}`}>
              due {formatDate(todo.dueDate)}
              {isOverdue ? " · overdue" : ""}
            </span>
          )}
        </div>
      </div>
      {showBacklog && !isDone && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onBacklog(todo.id)}
          className="btn-ghost touch-target shrink-0 text-xs disabled:opacity-50"
        >
          Backlog
        </button>
      )}
      <DeleteConfirmButton
        disabled={pending}
        title="Delete todo?"
        message={`Remove "${todo.title}"? This cannot be undone.`}
        onConfirm={() => onDelete(todo.id)}
      />
    </div>
  );
}

export default function TodoList({ initialTodos }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, updateOptimistic] = useOptimistic(initialTodos, applyOptimistic);
  const router = useRouter();
  const { success, error } = useToast();

  function runAction(action: OptimisticAction, fn: () => Promise<{ ok: boolean; error?: string }>, undo?: () => void) {
    startTransition(async () => {
      updateOptimistic(action);
      const result = await fn();
      if (!result.ok) {
        error(result.error ?? "Couldn't save — try again");
        router.refresh();
        return;
      }
      if (undo) {
        success("Todo deleted", { label: "Undo", onClick: undo });
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
    runAction(
      { type: "delete", id },
      () => deleteTodo(fd),
      () => {
        const restoreFd = new FormData();
        restoreFd.set("id", id);
        startTransition(async () => {
          await restoreTodo(restoreFd);
          router.refresh();
          success("Todo restored");
        });
      }
    );
  }

  function handleBacklog(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "backlog", id }, () => moveToBacklog(fd));
  }

  const open = optimisticTodos.filter((t) => t.status === "open");
  const done = optimisticTodos.filter((t) => t.status === "done");

  return (
    <div className={isPending ? "opacity-80" : ""}>
      <PendingIndicator pending={isPending} />
      {optimisticTodos.length === 0 && (
        <EmptyState
          icon="check"
          title="Your day is clear"
          description="No todos scheduled for this day. Add one above to get started."
          tip="Use priority and category tags to stay organized."
        />
      )}
      <div className="space-y-2">
        {open.map((t) => (
          <TodoRow
            key={t.id}
            todo={t}
            showBacklog
            onToggle={handleToggle}
            onDelete={handleDelete}
            onBacklog={handleBacklog}
            pending={isPending}
          />
        ))}
        {done.length > 0 && (
          <>
            <p className="section-title mt-6 text-sm text-slate-500">Done ({done.length})</p>
            {done.map((t) => (
              <TodoRow
                key={t.id}
                todo={t}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onBacklog={handleBacklog}
                pending={isPending}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
