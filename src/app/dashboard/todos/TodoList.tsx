"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import { useToast } from "@/components/Toast";
import { useLocalStorage } from "@/lib/use-client-store";
import {
  TODO_SORTS,
  moveIdTo,
  parseTodoSort,
  sortTodos,
  type TodoSort,
} from "@/lib/todo-sort";
import CollapsibleSection from "@/components/CollapsibleSection";
import {
  toggleTodo,
  deleteTodo,
  moveToBacklog,
  restoreTodo,
  reorderTodos,
} from "./actions";
import type { TodoItem } from "@/lib/queries/todos";
import TodoRow, { type MoveTarget } from "./TodoRow";
import SortableTodoList from "./SortableTodoList";

type Props = {
  initialTodos: TodoItem[];
  compact?: boolean;
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "backlog"; id: string }
  | { type: "reorder"; ids: string[] };

function applyOptimistic(
  todos: TodoItem[],
  action: OptimisticAction
): TodoItem[] {
  switch (action.type) {
    case "toggle":
      return todos.map(t =>
        t.id === action.id
          ? { ...t, status: t.status === "done" ? "open" : "done" }
          : t
      );
    case "delete":
    case "backlog":
      return todos.filter(t => t.id !== action.id);
    case "reorder":
      return todos.map(t => {
        const position = action.ids.indexOf(t.id);
        return position === -1 ? t : { ...t, position };
      });
  }
}

export default function TodoList({ initialTodos, compact = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, updateOptimistic] = useOptimistic(
    initialTodos,
    applyOptimistic
  );
  const router = useRouter();
  const { success, error } = useToast();
  const [storedSort, setSort] = useLocalStorage("control-todo-sort");
  const sort = parseTodoSort(storedSort);

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
        success(
          after.message,
          after.undo ? { label: "Undo", onClick: after.undo } : undefined
        );
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
    runAction({ type: "backlog", id }, () => moveToBacklog(fd), {
      message: "Moved to backlog",
    });
  }

  const sorted = sortTodos(optimisticTodos, sort);
  const open = sorted.filter(t => t.status === "open");
  const done = sorted.filter(t => t.status === "done");

  function handleReorder(
    ids: string[],
    after?: { message: string; undo?: () => void }
  ) {
    const fd = new FormData();
    ids.forEach(todoId => fd.append("ids", todoId));
    runAction({ type: "reorder", ids }, () => reorderTodos(fd), after);
  }

  function handleMoveTo(id: string, target: MoveTarget) {
    const before = open.map(t => t.id);
    const ids = moveIdTo(before, id, target === "top" ? 0 : before.length - 1);
    if (ids === before) return;
    handleReorder(ids, {
      message: target === "top" ? "Moved to top" : "Moved to bottom",
      undo: () => handleReorder(before),
    });
  }

  // Only open todos are reorderable; done ones keep their custom order.
  const canReorder = sort === "custom" && !compact && open.length > 1;

  const renderRows = (items: TodoItem[]) =>
    items.map(t => (
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
      {optimisticTodos.length > 1 && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <label htmlFor="todo-sort" className="text-sm text-muted">
            Sort by
          </label>
          <select
            id="todo-sort"
            className="input w-auto"
            value={sort}
            onChange={e => setSort(e.target.value as TodoSort)}
          >
            {Object.entries(TODO_SORTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-4">
        {open.length > 0 && (
          <CollapsibleSection
            title="Open"
            count={open.length}
            defaultOpen
            as="h2"
          >
            {canReorder ? (
              <SortableTodoList
                todos={open}
                onReorder={handleReorder}
                onMoveTo={handleMoveTo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onBacklog={handleBacklog}
                pending={isPending}
              />
            ) : (
              <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
                {renderRows(open)}
              </ul>
            )}
          </CollapsibleSection>
        )}
        {done.length > 0 && (
          <CollapsibleSection title="Done" count={done.length} as="h2">
            <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
              {renderRows(done)}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
