"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useToast } from "@/components/Toast";
import { useLocalStorage } from "@/lib/use-client-store";
import {
  applyOrder,
  moveIdTo,
  parseTodoSort,
  sortTodos,
  type TodoSort,
} from "@/lib/todo-sort";
import {
  groupBySlot,
  matchesFilter,
  parseTimeSlot,
  parseTodoFilter,
  serializeTodoFilter,
  type TodoFilter,
} from "@/lib/todo-meta";
import {
  toggleTodo,
  deleteTodo,
  moveToBacklog,
  restoreTodo,
  reorderTodos,
  updateTodo,
} from "./actions";
import type { TodoItem } from "@/lib/queries/todos";
import TodoRow, { type MoveTarget, type RowEditing } from "./TodoRow";
import SortableTodoList from "./SortableTodoList";
import OrderSaveBar from "./OrderSaveBar";
import DayProgress from "./DayProgress";
import TodoToolbar, { filterOptions } from "./TodoToolbar";
import { applyPatch, patchFormData, type TodoPatch } from "./TodoEditForm";

type Props = {
  initialTodos: TodoItem[];
  compact?: boolean;
  /** Category pills offered when editing. */
  categories?: string[];
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string }
  | { type: "backlog"; id: string }
  | { type: "edit"; id: string; patch: TodoPatch };

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
    case "edit":
      return todos.map(t =>
        t.id === action.id ? applyPatch(t, action.patch) : t
      );
    case "delete":
    case "backlog":
      return todos.filter(t => t.id !== action.id);
  }
}

/** Work, then After work, then Anytime; each keeps its incoming order. */
function slotOrder(todos: TodoItem[]): TodoItem[] {
  return groupBySlot(todos).flatMap(g => g.items);
}

export default function TodoList({
  initialTodos,
  compact = false,
  categories = [],
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTodos, updateOptimistic] = useOptimistic(
    initialTodos,
    applyOptimistic
  );
  const router = useRouter();
  const { success, error } = useToast();
  const [storedSort, setSort] = useLocalStorage("control-todo-sort");
  const sort = parseTodoSort(storedSort);
  const [storedFilter, setFilter] = useLocalStorage("control-todo-filter");
  // Custom order being edited: open todo ids, local until saved.
  const [draft, setDraft] = useState<string[] | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

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

  function idAction(fn: (fd: FormData) => Promise<{ ok: boolean }>) {
    return (id: string) => {
      const fd = new FormData();
      fd.set("id", id);
      return fn(fd);
    };
  }

  function handleToggle(id: string) {
    runAction({ type: "toggle", id }, () => idAction(toggleTodo)(id));
  }

  function handleDelete(id: string) {
    runAction({ type: "delete", id }, () => idAction(deleteTodo)(id), {
      message: "Todo deleted",
      undo: () => {
        startTransition(async () => {
          const res = await idAction(restoreTodo)(id);
          router.refresh();
          if (res.ok) success("Todo restored");
          else error("Couldn't restore — try again");
        });
      },
    });
  }

  function handleBacklog(id: string) {
    runAction({ type: "backlog", id }, () => idAction(moveToBacklog)(id), {
      message: "Moved to backlog",
    });
  }

  function handleSaveEdit(id: string, patch: TodoPatch) {
    setEditingId(null);
    runAction(
      { type: "edit", id, patch },
      () => updateTodo(patchFormData(id, patch)),
      { message: "Todo updated" }
    );
  }

  const editing: Omit<RowEditing, "active"> | undefined = compact
    ? undefined
    : {
        categories,
        onStart: setEditingId,
        onSave: handleSaveEdit,
        onCancel: () => setEditingId(null),
      };

  const sorted = sortTodos(optimisticTodos, sort);
  const grouped = sorted.some(t => parseTimeSlot(t.timeSlot));
  const byGroup = (items: TodoItem[]) => (grouped ? slotOrder(items) : items);
  const savedOpen = byGroup(sorted.filter(t => t.status === "open"));
  const open =
    sort === "custom" ? byGroup(applyOrder(savedOpen, draft)) : savedOpen;
  const done = sorted.filter(t => t.status === "done");
  // After a save the refreshed server order matches the draft, so this turns
  // false on its own without flashing back to the old order.
  const isOrderDirty = open.some((t, i) => t.id !== savedOpen[i].id);

  // A remembered filter that no longer applies (e.g. a category not used
  // today) falls back to "All" instead of hiding everything.
  const options = filterOptions(optimisticTodos);
  const storedParsed = parseTodoFilter(storedFilter);
  const filter: TodoFilter = options.some(
    o => serializeTodoFilter(o.filter) === serializeTodoFilter(storedParsed)
  )
    ? storedParsed
    : { kind: "all" };
  const isFiltered = filter.kind !== "all";
  const visibleOpen = open.filter(t => matchesFilter(t, filter));
  const visibleDone = done.filter(t => matchesFilter(t, filter));

  /** Replaces one group's ids inside the full open order. */
  function reorderGroup(groupIds: string[], nextGroupIds: string[]) {
    const queue = [...nextGroupIds];
    const inGroup = new Set(groupIds);
    setDraft(open.map(t => (inGroup.has(t.id) ? queue.shift()! : t.id)));
  }

  function moveWithin(groupIds: string[], id: string, target: MoveTarget) {
    reorderGroup(
      groupIds,
      moveIdTo(groupIds, id, target === "top" ? 0 : groupIds.length - 1)
    );
  }

  function handleSaveOrder() {
    const fd = new FormData();
    open.forEach(t => fd.append("ids", t.id));
    startSaving(async () => {
      let result: { ok: boolean; error?: string };
      try {
        result = await reorderTodos(fd);
      } catch {
        result = { ok: false };
      }
      if (result.ok) success("Order saved");
      else error(result.error ?? "Couldn't save order — try again");
    });
  }

  // Only open todos are reorderable; done ones keep their custom order.
  // A filtered view hides rows, so its order must not be saved.
  const canReorder =
    sort === "custom" && !compact && !isFiltered && open.length > 1;

  const renderRows = (items: TodoItem[]) =>
    items.map(t => (
      <TodoRow
        key={t.id}
        todo={t}
        showBacklog={!compact}
        compact={compact}
        showSlot={!grouped || t.status === "done"}
        editing={editing && { ...editing, active: editingId === t.id }}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onBacklog={handleBacklog}
        pending={isPending}
      />
    ));

  const renderOpen = (items: TodoItem[]) => {
    const ids = items.map(t => t.id);
    return canReorder && items.length > 1 ? (
      <SortableTodoList
        todos={items}
        onReorder={next => reorderGroup(ids, next)}
        onMoveTo={(id, target) => moveWithin(ids, id, target)}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onBacklog={handleBacklog}
        editing={editing}
        editingId={editingId}
        showSlot={!grouped}
        pending={isPending}
      />
    ) : (
      <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
        {renderRows(items)}
      </ul>
    );
  };

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
      {optimisticTodos.length === 0 ? (
        <EmptyState
          icon="check"
          title="Your day is clear"
          description="No todos for this day. Add one above to get started."
        />
      ) : (
        <DayProgress done={done.length} total={optimisticTodos.length} />
      )}
      {optimisticTodos.length > 1 && (
        <TodoToolbar
          options={options}
          filter={filter}
          onFilter={f => {
            setDraft(null);
            setFilter(serializeTodoFilter(f));
          }}
          total={optimisticTodos.length}
          sort={sort}
          onSort={(next: TodoSort) => {
            setDraft(null);
            setSort(next);
          }}
        />
      )}
      {canReorder && isOrderDirty && (
        <OrderSaveBar
          saving={isSaving}
          onSave={handleSaveOrder}
          onCancel={() => setDraft(null)}
        />
      )}
      {isFiltered && visibleOpen.length === 0 && visibleDone.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          Nothing matches this filter.
        </p>
      )}
      <div className="space-y-4">
        {visibleOpen.length > 0 &&
          (grouped ? (
            groupBySlot(visibleOpen).map(g => (
              <CollapsibleSection
                key={g.key}
                title={g.label}
                count={g.items.length}
                defaultOpen
                as="h2"
              >
                {renderOpen(g.items)}
              </CollapsibleSection>
            ))
          ) : (
            <CollapsibleSection
              title="Open"
              count={visibleOpen.length}
              defaultOpen
              as="h2"
            >
              {renderOpen(visibleOpen)}
            </CollapsibleSection>
          ))}
        {visibleDone.length > 0 && (
          <CollapsibleSection title="Done" count={visibleDone.length} as="h2">
            <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
              {renderRows(visibleDone)}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
