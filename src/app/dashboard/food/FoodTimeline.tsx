"use client";

import { useState, useTransition } from "react";
import CollapsibleSection from "@/components/CollapsibleSection";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { displayMealLabel, hasNutrition, type FoodMode } from "@/lib/food/meals";
import type { ActionResult } from "@/lib/action-result";
import { deleteFood, saveEntryAsDefault, updateFood } from "./actions";
import { HUNGER_LEVELS, NutritionInputs, ToggleChip } from "./QuickLog";
import type { DiaryEntry } from "./types";

type Props = {
  entries: DiaryEntry[];
  dayValue: string;
  mode: FoodMode;
  mealLabels: string[];
};

function sortKey(e: DiaryEntry): number {
  return new Date(e.eatenAt ?? e.createdAt).getTime();
}

export default function FoodTimeline({ entries, dayValue, mode, mealLabels }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sorted = [...entries].sort((a, b) => sortKey(a) - sortKey(b));

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">Nothing logged yet for this day.</p>;
  }

  return (
    <ol className="space-y-2">
      {sorted.map((entry) =>
        editingId === entry.id ? (
          <li key={entry.id}>
            <EntryEditor
              entry={entry}
              dayValue={dayValue}
              mode={mode}
              mealLabels={mealLabels}
              onClose={() => setEditingId(null)}
            />
          </li>
        ) : (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => setEditingId(entry.id)}
              className="card flex w-full items-start gap-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/60"
              aria-label={`Edit ${entry.name}`}
            >
              <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {entry.timeLabel ?? "--:--"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{entry.name}</span>
                  {entry.meal && <span className="badge-muted">{displayMealLabel(entry.meal)}</span>}
                  {entry.defaultMealId && <span className="badge-muted">Default</span>}
                </span>
                {entry.items && <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{entry.items}</span>}
                {entry.note && <span className="mt-0.5 block text-xs italic text-slate-400">{entry.note}</span>}
                {mode === "optimize" && hasNutrition(entry) && (
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {Math.round(entry.calories)} kcal · P{Math.round(entry.protein)} C{Math.round(entry.carbs)} F
                    {Math.round(entry.fat)}
                  </span>
                )}
              </span>
              <Icon name="pencil" className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </button>
          </li>
        )
      )}
    </ol>
  );
}

function EntryEditor({
  entry,
  dayValue,
  mode,
  mealLabels,
  onClose,
}: {
  entry: DiaryEntry;
  dayValue: string;
  mode: FoodMode;
  mealLabels: string[];
  onClose: () => void;
}) {
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [meal, setMeal] = useState<string | null>(entry.meal);
  const [hunger, setHunger] = useState<number | null>(entry.hunger);
  const labelOptions = entry.meal && !mealLabels.includes(entry.meal) ? [...mealLabels, entry.meal] : mealLabels;

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData, closeOnSuccess = true) {
    startTransition(async () => {
      const result = await action(fd);
      if (result.ok) {
        success(result.message ?? "Saved");
        if (closeOnSuccess) onClose();
      } else {
        error(result.error);
      }
    });
  }

  function idOnly(): FormData {
    const fd = new FormData();
    fd.set("id", entry.id);
    return fd;
  }

  return (
    <form
      className="card space-y-3 ring-2 ring-brand-500"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("id", entry.id);
        fd.set("day", dayValue);
        if (meal) fd.set("meal", meal);
        if (hunger) fd.set("hunger", String(hunger));
        run(updateFood, fd);
      }}
    >
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`edit-name-${entry.id}`} className="sr-only">Name</label>
          <input id={`edit-name-${entry.id}`} name="name" className="input" defaultValue={entry.name} required autoFocus />
        </div>
        <div className="w-28 shrink-0">
          <label htmlFor={`edit-time-${entry.id}`} className="sr-only">Time</label>
          <input
            id={`edit-time-${entry.id}`}
            name="time"
            type="time"
            className="input"
            defaultValue={entry.timeLabel ?? ""}
          />
        </div>
      </div>

      <div>
        <p className="label">Meal</p>
        <div className="flex flex-wrap gap-2">
          {labelOptions.map((label) => (
            <ToggleChip key={label} active={meal === label} onClick={() => setMeal(meal === label ? null : label)}>
              {displayMealLabel(label)}
            </ToggleChip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`edit-items-${entry.id}`} className="label">What was in it</label>
        <input id={`edit-items-${entry.id}`} name="items" className="input" defaultValue={entry.items ?? ""} />
      </div>

      <CollapsibleSection title="More" defaultOpen={Boolean(entry.note || entry.hunger)}>
        <div className="space-y-4">
          <div>
            <p className="label">Hunger before eating</p>
            <div className="flex flex-wrap gap-2">
              {HUNGER_LEVELS.map((h) => (
                <ToggleChip key={h.value} active={hunger === h.value} onClick={() => setHunger(hunger === h.value ? null : h.value)}>
                  {h.label}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor={`edit-note-${entry.id}`} className="label">Note</label>
            <input id={`edit-note-${entry.id}`} name="note" className="input" maxLength={500} defaultValue={entry.note ?? ""} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Nutrition" defaultOpen={mode === "optimize" || hasNutrition(entry)}>
        <NutritionInputs idPrefix={`edit-${entry.id}`} values={entry} />
      </CollapsibleSection>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="btn-primary touch-target disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onClose} className="btn-ghost touch-target">
          Cancel
        </button>
        {!entry.defaultMealId && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(saveEntryAsDefault, idOnly())}
            className="btn-ghost touch-target disabled:opacity-50"
          >
            Save as Default Meal
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(deleteFood, idOnly())}
          className="touch-target ml-auto inline-flex items-center gap-1 px-2 text-sm text-slate-400 hover:text-red-500 disabled:opacity-50"
        >
          <Icon name="trash" className="h-4 w-4" />
          Delete
        </button>
      </div>
    </form>
  );
}
