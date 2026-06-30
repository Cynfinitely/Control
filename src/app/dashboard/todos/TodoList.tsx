"use client";

import { useOptimistic, useTransition } from "react";
import Icon from "@/components/Icon";
import { toggleTodo, deleteTodo, moveToBacklog } from "./actions";
import type { TodoItem } from "@/lib/queries/todos";

type Props = {
  initialTodos: TodoItem[];
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "backlog"; id: string };

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
  return (
    <div className={`card flex items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => onToggle(todo.id)}
        className={`touch-target flex h-6 w-6 items-center justify-center rounded border disabled:opacity-50 ${
          isDone
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 hover:border-brand-500"
        }`}
        title={isDone ? "Mark open" : "Mark done"}
      >
        {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
      </button>
      <p className={`flex-1 ${isDone ? "text-slate-500 line-through" : "font-medium text-slate-800"}`}>
        {todo.title}
      </p>
      {showBacklog && !isDone && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onBacklog(todo.id)}
          className="btn-ghost touch-target text-xs disabled:opacity-50"
        >
          Backlog
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => onDelete(todo.id)}
        className="touch-target text-slate-300 hover:text-red-500 disabled:opacity-50"
        title="Delete"
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TodoList({ initialTodos }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, updateOptimistic] = useOptimistic(initialTodos, applyOptimistic);

  function runAction(action: OptimisticAction, fn: () => Promise<void>) {
    startTransition(async () => {
      updateOptimistic(action);
      await fn();
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
    runAction({ type: "delete", id }, () => deleteTodo(fd));
  }

  function handleBacklog(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "backlog", id }, () => moveToBacklog(fd));
  }

  const open = optimisticTodos.filter((t) => t.status === "open");
  const done = optimisticTodos.filter((t) => t.status === "done");

  return (
    <div className={`space-y-2 ${isPending ? "opacity-80" : ""}`}>
      {optimisticTodos.length === 0 && (
        <p className="text-sm text-slate-400">No todos for this day. Add one above.</p>
      )}
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
  );
}
