"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import CheckButton from "@/components/CheckButton";
import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";
import CollapsibleSection from "@/components/CollapsibleSection";
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
        return { ...item, status: "open" }; // done or skipped → open (matches toggleFocusItem)
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
    <li className={clsx("flex items-center gap-3 px-4 py-3", (isDone || isSkipped) && "opacity-80")}>
      <CheckButton
        checked={isDone}
        disabled={pending || isSkipped}
        onChange={() => onToggle(item.id)}
        label={
          isSkipped
            ? `“${item.title}” was skipped`
            : isDone
              ? `Mark “${item.title}” not done`
              : `Mark “${item.title}” done`
        }
      />
      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "break-words",
            isDone || isSkipped ? "text-muted line-through" : "font-medium text-slate-800 dark:text-slate-100"
          )}
        >
          {item.title}
        </p>
        {(isSkipped || item.linkLabel) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isSkipped && <span className="badge-warning">Skipped</span>}
            {item.linkLabel && <span className="badge-muted">{item.linkLabel}</span>}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isDone && !isSkipped && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onSkip(item.id)}
            className="btn-ghost btn-sm min-h-[40px]"
            aria-label={`Skip “${item.title}”`}
          >
            Skip
          </button>
        )}
        {isSkipped && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onToggle(item.id)}
            className="btn-ghost btn-sm min-h-[40px]"
            aria-label={`Reopen “${item.title}”`}
          >
            Reopen
          </button>
        )}
        <IconButton
          icon="trash"
          tone="danger"
          disabled={pending}
          onClick={() => onDelete(item.id)}
          aria-label={`Remove “${item.title}”`}
        />
      </div>
    </li>
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
    // No toast: the row's "Skipped" badge is the confirmation.
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
          const res = await restoreFocusItem(restoreFd);
          router.refresh();
          if (res.ok) success("Focus item restored");
          else error(res.error);
        });
      }
    );
  }

  const open = optimisticItems.filter((i) => i.status === "open");
  const closed = optimisticItems.filter((i) => i.status !== "open");

  const rows = (items: WorkFocusItemRow[]) =>
    items.map((item) => (
      <FocusRow
        key={item.id}
        item={item}
        onToggle={handleToggle}
        onSkip={handleSkip}
        onDelete={handleDelete}
        pending={isPending}
      />
    ));

  return (
    <div className={clsx("relative", isPending && "opacity-80")}>
      <PendingIndicator pending={isPending} />
      {optimisticItems.length === 0 && (
        <EmptyState
          icon="briefcase"
          title="Set today's work focus"
          description="Pick a few intentional work outcomes for the day — not a full backlog."
          tip="Personal errands stay in Todos. Deep career tracking stays in Career."
        />
      )}
      <div className="space-y-4">
        {open.length > 0 && (
          <CollapsibleSection title="Open" count={open.length} defaultOpen as="h2">
            <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">{rows(open)}</ul>
          </CollapsibleSection>
        )}
        {closed.length > 0 && (
          <CollapsibleSection title="Done" count={closed.length} as="h2">
            <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">{rows(closed)}</ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
