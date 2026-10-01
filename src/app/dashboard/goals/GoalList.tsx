"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import IconButton from "@/components/IconButton";
import CheckButton from "@/components/CheckButton";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import CollapsibleSection from "@/components/CollapsibleSection";
import {
  toggleGoalComplete,
  incrementGoal,
  decrementGoal,
  deleteGoal,
  restoreGoal,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
} from "./actions";
import type { GoalItem } from "@/lib/queries/goals";
import { formatDate } from "@/lib/date";

type Props = {
  initialGoals: GoalItem[];
  /** Link for the empty-state CTA (keeps the current period). */
  addHref?: string;
  /**
   * Compact rows for embedding (e.g. Weekly Review): toggle / ±1 only,
   * no milestones, check-ins or delete, no Active/Completed grouping.
   */
  compact?: boolean;
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "increment"; id: string }
  | { type: "decrement"; id: string }
  | { type: "delete"; id: string };

function applyOptimistic(goals: GoalItem[], action: OptimisticAction): GoalItem[] {
  switch (action.type) {
    case "toggle":
      return goals.map((g) =>
        g.id === action.id
          ? { ...g, status: g.status === "completed" ? "active" : "completed" }
          : g
      );
    case "increment":
      return goals.map((g) => {
        if (g.id !== action.id) return g;
        const next = g.currentValue + 1;
        const target = g.targetValue ?? 1;
        return {
          ...g,
          currentValue: next,
          status: next >= target ? "completed" : g.status,
        };
      });
    case "decrement":
      return goals.map((g) => {
        if (g.id !== action.id) return g;
        const latest = g.checkIns[0]?.value;
        const next = Math.max(0, g.currentValue - (latest && latest > 0 ? latest : 1));
        const target = g.targetValue ?? 1;
        return {
          ...g,
          currentValue: next,
          checkIns: g.checkIns.slice(1),
          status: g.status === "completed" && next < target ? "active" : g.status,
        };
      });
    case "delete":
      return goals.filter((g) => g.id !== action.id);
  }
}

function formatValue(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function GoalMilestones({ goal }: { goal: GoalItem }) {
  const done = goal.milestones.filter((m) => m.done).length;
  return (
    <CollapsibleSection
      title={goal.milestones.length ? `Milestones (${done}/${goal.milestones.length})` : "Add milestones"}
      className="mt-2 border-t border-slate-100 pt-1 text-sm dark:border-slate-700"
    >
      <ul className="space-y-0.5">
        {goal.milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <ActionForm action={toggleMilestone} successMessage={false} className="flex">
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="goalId" value={goal.id} />
              <CheckButton
                type="submit"
                size="sm"
                checked={m.done}
                label={m.done ? `Mark milestone “${m.title}” open` : `Mark milestone “${m.title}” done`}
              />
            </ActionForm>
            <span
              className={clsx(
                "min-w-0 flex-1",
                m.done ? "text-muted line-through" : "text-slate-700 dark:text-slate-200"
              )}
            >
              {m.title}
            </span>
            <ActionForm
              action={deleteMilestone}
              confirm={{ title: `Delete milestone “${m.title}”?` }}
              successMessage="Milestone deleted"
            >
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="goalId" value={goal.id} />
              <SubmitIconButton
                icon={<Icon name="trash" className="h-4 w-4" />}
                aria-label={`Delete milestone “${m.title}”`}
                className="btn-icon-danger h-9 w-9"
              />
            </ActionForm>
          </li>
        ))}
      </ul>
      <ActionForm action={addMilestone} resetOnSuccess successMessage="Milestone added" className="mt-2 flex gap-2">
        <input type="hidden" name="goalId" value={goal.id} />
        <label htmlFor={`milestone-${goal.id}`} className="sr-only">
          New milestone for {goal.title}
        </label>
        <input
          id={`milestone-${goal.id}`}
          name="title"
          className="input flex-1"
          placeholder="Add milestone…"
          required
        />
        <SubmitButton className="btn-ghost btn-sm">Add</SubmitButton>
      </ActionForm>
    </CollapsibleSection>
  );
}

function GoalCheckIns({ goal }: { goal: GoalItem }) {
  if (goal.checkIns.length === 0) return null;
  return (
    <CollapsibleSection
      title="Recent check-ins"
      count={goal.checkIns.length}
      className="mt-2 border-t border-slate-100 pt-1 text-sm dark:border-slate-700"
    >
      <ul className="space-y-0.5">
        {goal.checkIns.map((c) => (
          <li key={c.id} className="text-xs text-muted">
            +{formatValue(c.value)} · {formatDate(c.date)}
            {c.note && ` · ${c.note}`}
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

function GoalProgress({ goal }: { goal: GoalItem }) {
  const target = goal.targetValue ?? 1;
  const pct = Math.round(Math.min(100, Math.max(0, (goal.currentValue / target) * 100)));
  const text = `${formatValue(goal.currentValue)} of ${formatValue(target)}`;
  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{text}</span>
        {goal.linkType && <span className="badge-brand">Auto: {goal.linkType}</span>}
      </div>
      <div
        className="progress-track mt-1.5 h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-label={`${goal.title} progress`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(goal.currentValue, target)}
        aria-valuetext={text}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            goal.status === "completed" ? "bg-green-500" : "bg-brand-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function IncrementWithNote({
  goal,
  pending,
  onIncrement,
}: {
  goal: GoalItem;
  pending: boolean;
  onIncrement: (id: string, note?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const inputId = useId();

  if (!open) {
    return (
      <button type="button" className="link text-xs" onClick={() => setOpen(true)} disabled={pending}>
        +1 with a note
      </button>
    );
  }

  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onIncrement(goal.id, note.trim() || undefined);
        setNote("");
        setOpen(false);
      }}
    >
      <div className="min-w-[12rem] flex-1">
        <label htmlFor={inputId} className="label">
          Check-in note
        </label>
        <input
          id={inputId}
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. 5 km easy run"
          autoFocus
          maxLength={200}
        />
      </div>
      <button type="submit" className="btn-primary" disabled={pending}>
        +1
      </button>
      <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}

function GoalRow({
  goal,
  onToggle,
  onIncrement,
  onDecrement,
  onDelete,
  pending,
  compact,
}: {
  goal: GoalItem;
  onToggle: (id: string) => void;
  onIncrement: (id: string, note?: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
  compact: boolean;
}) {
  const isDone = goal.status === "completed";
  const rowClass = clsx(compact ? "px-4 py-3" : "card py-3", pending && "opacity-70");

  if (goal.type === "numeric") {
    return (
      <div className={rowClass} aria-busy={pending || undefined}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={clsx(
                  "font-medium",
                  isDone ? "text-muted line-through" : "text-slate-800 dark:text-slate-100"
                )}
              >
                {goal.title}
              </p>
              {isDone && <span className="badge-success">Done</span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {pending && <Spinner className="h-4 w-4 text-brand-600" />}
            <IconButton
              icon="minus"
              aria-label={`Undo last check-in for ${goal.title}`}
              title="−1 (undo last check-in)"
              disabled={pending || goal.currentValue <= 0}
              onClick={() => onDecrement(goal.id)}
            />
            {!isDone && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onIncrement(goal.id)}
                className="btn-primary touch-target min-w-[3rem]"
                aria-label={`Add 1 to ${goal.title}`}
              >
                +1
              </button>
            )}
            {!compact && (
              <IconButton
                icon="trash"
                tone="danger"
                aria-label={`Delete goal ${goal.title}`}
                disabled={pending}
                onClick={() => onDelete(goal.id)}
              />
            )}
          </div>
        </div>
        <GoalProgress goal={goal} />
        {!isDone && !compact && (
          <div className="mt-1">
            <IncrementWithNote goal={goal} pending={pending} onIncrement={onIncrement} />
          </div>
        )}
        {!compact && (
          <>
            <GoalMilestones goal={goal} />
            <GoalCheckIns goal={goal} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={rowClass} aria-busy={pending || undefined}>
      <div className="flex items-center gap-3">
        <CheckButton
          checked={isDone}
          disabled={pending}
          onChange={() => onToggle(goal.id)}
          label={isDone ? `Mark “${goal.title}” active` : `Mark “${goal.title}” complete`}
        />
        <p
          className={clsx(
            "min-w-0 flex-1",
            isDone ? "text-muted line-through" : "font-medium text-slate-800 dark:text-slate-100"
          )}
        >
          {goal.title}
        </p>
        {pending && <Spinner className="h-4 w-4 text-brand-600" />}
        {!compact && (
          <IconButton
            icon="trash"
            tone="danger"
            aria-label={`Delete goal ${goal.title}`}
            disabled={pending}
            onClick={() => onDelete(goal.id)}
          />
        )}
      </div>
      {!compact && <GoalMilestones goal={goal} />}
    </div>
  );
}

export default function GoalList({ initialGoals, addHref = "/dashboard/goals?focus=add", compact = false }: Props) {
  const [, startTransition] = useTransition();
  const [optimisticGoals, updateOptimistic] = useOptimistic(initialGoals, applyOptimistic);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const router = useRouter();
  const { success, error } = useToast();

  function setPending(id: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function runAction(
    action: OptimisticAction,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    undo?: () => void
  ) {
    setPending(action.id, true);
    startTransition(async () => {
      updateOptimistic(action);
      try {
        const result = await fn();
        if (!result.ok) {
          error(result.error ?? "Couldn't save — try again");
          router.refresh();
          return;
        }
        if (undo) success("Goal deleted", { label: "Undo", onClick: undo });
      } catch {
        error("Couldn't save — try again");
        router.refresh();
      } finally {
        setPending(action.id, false);
      }
    });
  }

  function idForm(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    return fd;
  }

  function handleToggle(id: string) {
    runAction({ type: "toggle", id }, () => toggleGoalComplete(idForm(id)));
  }

  function handleIncrement(id: string, note?: string) {
    const fd = idForm(id);
    if (note) fd.set("note", note);
    runAction({ type: "increment", id }, () => incrementGoal(fd));
  }

  function handleDecrement(id: string) {
    runAction({ type: "decrement", id }, () => decrementGoal(idForm(id)));
  }

  function handleDelete(id: string) {
    runAction(
      { type: "delete", id },
      () => deleteGoal(idForm(id)),
      () => {
        startTransition(async () => {
          const result = await restoreGoal(idForm(id));
          router.refresh();
          if (result.ok) success("Goal restored");
          else error(result.error);
        });
      }
    );
  }

  const active = optimisticGoals.filter((g) => g.status === "active");
  const completed = optimisticGoals.filter((g) => g.status === "completed");

  const renderRow = (g: GoalItem) => (
    <GoalRow
      key={g.id}
      goal={g}
      onToggle={handleToggle}
      onIncrement={handleIncrement}
      onDecrement={handleDecrement}
      onDelete={handleDelete}
      pending={pendingIds.has(g.id)}
      compact={compact}
    />
  );

  if (compact) {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {[...active, ...completed].map(renderRow)}
      </div>
    );
  }

  return (
    <div>
      {optimisticGoals.length === 0 && (
        <EmptyState
          icon="target"
          title="No goals yet"
          description="Set a weekly, monthly, or yearly goal to track progress over time."
          actionHref={addHref}
          actionLabel="Add your first goal"
        />
      )}
      <div className="space-y-2">
        {active.length > 0 && (
          <CollapsibleSection title="Active" as="h2" count={active.length} defaultOpen>
            <div className="space-y-2">{active.map(renderRow)}</div>
          </CollapsibleSection>
        )}
        {completed.length > 0 && (
          <CollapsibleSection title="Completed" as="h2" count={completed.length} className="mt-4">
            <div className="space-y-2">{completed.map(renderRow)}</div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
