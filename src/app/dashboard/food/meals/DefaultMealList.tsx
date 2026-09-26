"use client";

import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
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
      <p className="text-sm text-slate-400">
        No Default Meals yet. Create one below, or open a diary entry and choose “Save as Default Meal”.
      </p>
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
                <button type="button" className="btn-ghost text-xs" onClick={() => setEditingId(null)}>
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
                  <p className="mt-0.5 text-xs text-slate-400">
                    Logged {usage[meal.id] ?? 0}× in the last 4 weeks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(meal.id)}
                  className="touch-target px-2 text-slate-400 hover:text-brand-600"
                  aria-label={`Edit ${meal.name}`}
                >
                  <Icon name="pencil" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmId(meal.id)}
                  className="touch-target px-2 text-slate-300 hover:text-red-500 disabled:opacity-50"
                  aria-label={`Remove ${meal.name}`}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={confirmId !== null}
        title="Remove this Default Meal?"
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
