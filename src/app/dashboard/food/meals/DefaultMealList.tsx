"use client";

import { useState, useTransition } from "react";
import IconButton from "@/components/IconButton";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import type { DefaultMealView } from "@/lib/queries/food";
import { displayMealLabel } from "@/lib/food/meals";
import { deleteDefaultMeal } from "../actions";
import DefaultMealForm from "./DefaultMealForm";

type Props = {
  meals: DefaultMealView[];
  mealLabels: string[];
  usage: Record<string, number>;
};

export default function DefaultMealList({ meals, mealLabels, usage }: Props) {
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (meals.length === 0) {
    return (
      <EmptyState
        variant="inline"
        icon="food"
        title="No Default Meals yet"
        description="Create one above, or open a diary entry and choose “Save as Default Meal”."
      />
    );
  }

  function remove(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const result = await deleteDefaultMeal(fd);
      if (result.ok) success(result.message ?? "Removed");
      else error(result.error);
    });
  }

  return (
    <>
      <ul className="space-y-2">
        {meals.map((meal) => (
          <li key={meal.id} className="card py-3">
            {editingId === meal.id ? (
              <div className="space-y-2">
                <DefaultMealForm meal={meal} mealLabels={mealLabels} onDone={() => setEditingId(null)} />
                <button type="button" className="btn-ghost touch-target" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                    {meal.name}
                    {meal.meal && <span className="badge-muted">{displayMealLabel(meal.meal)}</span>}
                  </p>
                  {meal.items.length > 0 && (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {meal.items.map((i) => i.name).join(", ")}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted">
                    Logged {usage[meal.id] ?? 0}× in the last 4 weeks
                  </p>
                </div>
                <div className="-mr-2 -mt-2 flex shrink-0">
                  <IconButton icon="pencil" onClick={() => setEditingId(meal.id)} aria-label={`Edit ${meal.name}`} />
                  <IconButton
                    icon="trash"
                    tone="danger"
                    disabled={pending}
                    onClick={() => setConfirmId(meal.id)}
                    aria-label={`Remove ${meal.name}`}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={confirmId !== null}
        title={`Remove “${meals.find((m) => m.id === confirmId)?.name ?? "this Default Meal"}”?`}
        message="Past diary entries and planned meals stay as they are."
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmId) remove(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
