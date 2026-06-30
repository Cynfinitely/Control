"use client";

import { useOptimistic, useTransition } from "react";
import Icon from "@/components/Icon";
import { toggleGoalComplete, incrementGoal, deleteGoal } from "./actions";
import type { GoalItem } from "@/lib/queries/goals";

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

function DeleteGoalButton({
  id,
  onDelete,
  pending,
}: {
  id: string;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onDelete(id)}
      className="touch-target text-slate-300 hover:text-red-500 disabled:opacity-50"
      title="Delete"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
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
      <div className={`card flex flex-wrap items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
        <div className="flex-1">
          <p className={`font-medium ${isDone ? "text-slate-500 line-through" : "text-slate-800"}`}>
            {goal.title}
          </p>
          <p className="text-sm text-slate-400">
            {Math.round(goal.currentValue)} / {Math.round(target)}
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
        <DeleteGoalButton id={goal.id} onDelete={onDelete} pending={pending} />
      </div>
    );
  }

  return (
    <div className={`card flex items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() => onToggle(goal.id)}
        className={`touch-target flex h-6 w-6 items-center justify-center rounded border disabled:opacity-50 ${
          isDone
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 hover:border-brand-500"
        }`}
        title={isDone ? "Mark active" : "Mark complete"}
      >
        {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
      </button>
      <p className={`flex-1 ${isDone ? "text-slate-500 line-through" : "font-medium text-slate-800"}`}>
        {goal.title}
      </p>
      <DeleteGoalButton id={goal.id} onDelete={onDelete} pending={pending} />
    </div>
  );
}

export default function GoalList({ initialGoals }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticGoals, updateOptimistic] = useOptimistic(initialGoals, applyOptimistic);

  function runAction(action: OptimisticAction, fn: () => Promise<void>) {
    startTransition(async () => {
      updateOptimistic(action);
      await fn();
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
    runAction({ type: "delete", id }, () => deleteGoal(fd));
  }

  const active = optimisticGoals.filter((g) => g.status === "active");
  const completed = optimisticGoals.filter((g) => g.status === "completed");

  return (
    <div className={`space-y-2 ${isPending ? "opacity-80" : ""}`}>
      {optimisticGoals.length === 0 && (
        <p className="text-sm text-slate-400">No goals for this period yet.</p>
      )}
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
  );
}
