"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import EmptyState from "@/components/EmptyState";
import PendingIndicator from "@/components/PendingIndicator";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { useToast } from "@/components/Toast";
import {
  toggleGoalComplete,
  incrementGoal,
  deleteGoal,
  restoreGoal,
} from "./actions";
import type { GoalItem } from "@/lib/queries/goals";
import SubmitButton from "@/components/SubmitButton";
import { formatDate } from "@/lib/date";
import { addMilestone, toggleMilestone, deleteMilestone } from "./actions";

type Props = {
  initialGoals: GoalItem[];
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "increment"; id: string }
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
    case "delete":
      return goals.filter((g) => g.id !== action.id);
  }
}

function GoalMilestones({ goal, pending }: { goal: GoalItem; pending: boolean }) {
  return (
    <details className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-700">
      <summary className="cursor-pointer text-xs text-brand-600">
        Milestones ({goal.milestones.filter((m) => m.done).length}/{goal.milestones.length})
      </summary>
      <div className="mt-2 space-y-1">
        {goal.milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <form action={toggleMilestone}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="goalId" value={goal.id} />
              <SubmitButton
                className={`flex h-5 w-5 items-center justify-center rounded border ${
                  m.done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 dark:border-slate-600"
                }`}
                disabled={pending}
                aria-label={m.done ? "Mark milestone open" : "Mark milestone done"}
              >
                {m.done ? <Icon name="check" className="h-2.5 w-2.5" /> : null}
              </SubmitButton>
            </form>
            <span className={m.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}>{m.title}</span>
            <form action={deleteMilestone}>
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="goalId" value={goal.id} />
              <SubmitButton className="text-slate-300 hover:text-red-500" disabled={pending} aria-label="Delete milestone">
                <Icon name="trash" className="h-3 w-3" />
              </SubmitButton>
            </form>
          </div>
        ))}
        <form action={addMilestone} className="mt-2 flex gap-1">
          <input type="hidden" name="goalId" value={goal.id} />
          <input name="title" className="input flex-1 py-1 text-xs" placeholder="Add milestone…" required aria-label="Milestone title" />
          <SubmitButton className="btn-ghost py-1 text-xs" disabled={pending}>
            Add
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}

function GoalCheckIns({ goal }: { goal: GoalItem }) {
  if (goal.checkIns.length === 0) return null;
  return (
    <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-700">
      <p className="text-xs text-slate-400">Recent check-ins</p>
      <ul className="mt-1 space-y-0.5">
        {goal.checkIns.map((c) => (
          <li key={c.id} className="text-xs text-slate-500">
            +{c.value} · {formatDate(c.date)}
            {c.note && ` · ${c.note}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GoalRow({
  goal,
  onToggle,
  onIncrement,
  onDelete,
  pending,
}: {
  goal: GoalItem;
  onToggle: (id: string) => void;
  onIncrement: (id: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const isDone = goal.status === "completed";

  if (goal.type === "numeric") {
    const target = goal.targetValue ?? 1;
    return (
      <div className={`card py-3 ${isDone ? "opacity-70" : ""}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <p className={`font-medium ${isDone ? "text-slate-500 line-through" : "text-slate-800 dark:text-slate-100"}`}>
              {goal.title}
            </p>
            <p className="text-sm text-slate-400">
              {Math.round(goal.currentValue)} / {Math.round(target)}
              {goal.linkType && (
                <span className="ml-2 badge bg-blue-50 text-blue-600">auto: {goal.linkType}</span>
              )}
            </p>
          </div>
          {!isDone && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onIncrement(goal.id)}
              className="btn-primary touch-target min-w-[3rem] disabled:opacity-50"
            >
              +1
            </button>
          )}
          {isDone && <span className="badge bg-green-100 text-green-700">Done</span>}
          <DeleteConfirmButton
            disabled={pending}
            title="Delete goal?"
            message={`Remove "${goal.title}"?`}
            onConfirm={() => onDelete(goal.id)}
          />
        </div>
        <GoalMilestones goal={goal} pending={pending} />
        <GoalCheckIns goal={goal} />
      </div>
    );
  }

  return (
    <div className={`card py-3 ${isDone ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => onToggle(goal.id)}
          className={`touch-target flex h-6 w-6 items-center justify-center rounded border disabled:opacity-50 ${
            isDone
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-300 hover:border-brand-500 dark:border-slate-600"
          }`}
          aria-label={isDone ? "Mark active" : "Mark complete"}
        >
          {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
        </button>
        <p className={`flex-1 ${isDone ? "text-slate-500 line-through" : "font-medium text-slate-800 dark:text-slate-100"}`}>
          {goal.title}
        </p>
        <DeleteConfirmButton
          disabled={pending}
          title="Delete goal?"
          message={`Remove "${goal.title}"?`}
          onConfirm={() => onDelete(goal.id)}
        />
      </div>
      <GoalMilestones goal={goal} pending={pending} />
    </div>
  );
}

export default function GoalList({ initialGoals }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticGoals, updateOptimistic] = useOptimistic(initialGoals, applyOptimistic);
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
      if (undo) success("Goal deleted", { label: "Undo", onClick: undo });
    });
  }

  function handleToggle(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "toggle", id }, () => toggleGoalComplete(fd));
  }

  function handleIncrement(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction({ type: "increment", id }, () => incrementGoal(fd));
  }

  function handleDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    runAction(
      { type: "delete", id },
      () => deleteGoal(fd),
      () => {
        const restoreFd = new FormData();
        restoreFd.set("id", id);
        startTransition(async () => {
          await restoreGoal(restoreFd);
          router.refresh();
          success("Goal restored");
        });
      }
    );
  }

  const active = optimisticGoals.filter((g) => g.status === "active");
  const completed = optimisticGoals.filter((g) => g.status === "completed");

  return (
    <div className={isPending ? "opacity-80" : ""}>
      <PendingIndicator pending={isPending} />
      {optimisticGoals.length === 0 && (
        <EmptyState
          icon="target"
          title="No goals yet"
          description="Set a weekly, monthly, or yearly goal to track progress over time."
          actionHref="/dashboard/goals?focus=add"
          actionLabel="Add your first goal"
        />
      )}
      <div className="space-y-2">
        {active.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            onToggle={handleToggle}
            onIncrement={handleIncrement}
            onDelete={handleDelete}
            pending={isPending}
          />
        ))}
        {completed.length > 0 && (
          <>
            <p className="section-title mt-6 text-sm text-slate-500">Completed ({completed.length})</p>
            {completed.map((g) => (
              <GoalRow
                key={g.id}
                goal={g}
                onToggle={handleToggle}
                onIncrement={handleIncrement}
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
