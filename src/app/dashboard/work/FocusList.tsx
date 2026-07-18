"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { useToast } from "@/components/Toast";
import { toggleFocusItem, skipFocusItem, deleteFocusItem, restoreFocusItem } from "./actions";
import type { WorkFocusItemRow } from "@/lib/queries/work";

type Props = {
  initialItems: WorkFocusItemRow[];
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "skip"; id: string }
  | { type: "delete"; id: string };

function applyOptimistic(items: WorkFocusItemRow[], action: OptimisticAction): WorkFocusItemRow[] {
  switch (action.type) {
    case "toggle":
      return items.map((item) => {
        if (item.id !== action.id) return item;
        if (item.status === "open") return { ...item, status: "done" };
        return { ...item, status: "open" };
      });
    case "skip":
      return items.map((item) => (item.id === action.id ? { ...item, status: "skipped" } : item));
    case "delete":
      return items.filter((item) => item.id !== action.id);
  }
}

function FocusRow({
  item,
  onToggle,
  onSkip,
  onDelete,
  pending,
}: {
  item: WorkFocusItemRow;
  onToggle: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const isDone = item.status === "done";
  const isSkipped = item.status === "skipped";

  return (
    <div
      className={`card flex items-center gap-3 py-3 ${isDone || isSkipped ? "opacity-70" : ""}`}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => onToggle(item.id)}
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
        <p
          className={
            isDone || isSkipped
              ? "text-slate-500 line-through"
              : "font-medium text-slate-800 dark:text-slate-100"
          }
        >
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {isSkipped && <span className="badge bg-amber-50 text-xs text-amber-700">skipped</span>}
          {item.linkLabel && (
            <span className="badge bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {item.linkLabel}
            </span>
          )}
        </div>
      </div>
      {!isDone && !isSkipped && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onSkip(item.id)}
          className="btn-ghost touch-target shrink-0 text-xs disabled:opacity-50"
        >
          Skip
        </button>
      )}
      <DeleteConfirmButton
        disabled={pending}
        title="Remove focus item?"
        message={`Remove "${item.title}"?`}
        onConfirm={() => onDelete(item.id)}
      />
    </div>
  );
}

export default function FocusList({ initialItems }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, updateOptimistic] = useOptimistic(initialItems, applyOptimistic);
  const router = useRouter();
  const { success, error } = useToast();

  function runAction(
    action: OptimisticAction,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    undo?: () => void
  ) {
    startTransition(async () => {
      updateOptimistic(action);
      const result = await fn();
      if (!result.ok) {
        error(result.error ?? "Couldn't save — try again");
        router.refresh();
        return;
      }
      if (undo) {
        success("Focus item removed", { label: "Undo", onClick: undo });
      }
    });
  }

  function handleToggle(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "toggle", id }, () => toggleFocusItem(fd));
  }

  function handleSkip(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "skip", id }, () => skipFocusItem(fd));
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction(
      { type: "delete", id },
      () => deleteFocusItem(fd),
      () => {
        const restoreFd = new FormData();
        restoreFd.set("id", id);
        startTransition(async () => {
          await restoreFocusItem(restoreFd);
          router.refresh();
          success("Focus item restored");
        });
      }
    );
  }

  const open = optimisticItems.filter((i) => i.status === "open");
  const closed = optimisticItems.filter((i) => i.status !== "open");

  return (
    <div className={isPending ? "opacity-80" : ""}>
      <PendingIndicator pending={isPending} />
      {optimisticItems.length === 0 && (
        <EmptyState
          icon="briefcase"
          title="Set today's work focus"
          description="Pick a few intentional work outcomes for the day — not a full backlog."
          tip="Personal errands stay in Todos. Deep career tracking stays in Career."
        />
      )}
      <div className="space-y-2">
        {open.map((item) => (
          <FocusRow
            key={item.id}
            item={item}
            onToggle={handleToggle}
            onSkip={handleSkip}
            onDelete={handleDelete}
            pending={isPending}
          />
        ))}
        {closed.length > 0 && (
          <>
            <p className="section-title mt-6 text-sm text-slate-500">Closed ({closed.length})</p>
            {closed.map((item) => (
              <FocusRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onSkip={handleSkip}
                onDelete={handleDelete}
                pending={isPending}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
