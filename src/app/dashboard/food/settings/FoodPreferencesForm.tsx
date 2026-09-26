"use client";

import { useState } from "react";
import clsx from "clsx";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import { FOOD_MODES, FOOD_MODE_INFO, MEAL_LABEL_PRESETS, type FoodMode } from "@/lib/food/meals";
import { saveFoodPreferencesForm } from "../actions";

export default function FoodPreferencesForm({ mode, mealLabels }: { mode: FoodMode; mealLabels: string[] }) {
  const [selectedMode, setSelectedMode] = useState<FoodMode>(mode);
  const [labels, setLabels] = useState(mealLabels.join("\n"));

  return (
    <FormAction action={saveFoodPreferencesForm} successMessage="Preferences saved" className="card space-y-6">
      <fieldset>
        <legend className="section-title mb-1">Mode</legend>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Modes only change what the diary emphasizes. Everything you log is kept either way.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {FOOD_MODES.map((m) => (
            <label
              key={m}
              className={clsx(
                "cursor-pointer rounded-lg p-3 ring-1 ring-inset transition",
                selectedMode === m
                  ? "bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950"
                  : "ring-slate-200 hover:bg-slate-50 dark:ring-slate-600 dark:hover:bg-slate-700/60"
              )}
            >
              <input
                type="radio"
                name="mode"
                value={m}
                checked={selectedMode === m}
                onChange={() => setSelectedMode(m)}
                className="sr-only"
              />
              <span className="block font-medium text-slate-800 dark:text-slate-100">{FOOD_MODE_INFO[m].label}</span>
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {FOOD_MODE_INFO[m].description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="meal-labels" className="section-title mb-1 block">
          Meal labels
        </label>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          One per line. Use whatever matches how you actually eat. Past entries keep their label.
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          {MEAL_LABEL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn-ghost text-xs"
              onClick={() => setLabels(preset.labels.join("\n"))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <textarea
          id="meal-labels"
          name="mealLabels"
          rows={4}
          className="input"
          value={labels}
          onChange={(e) => setLabels(e.target.value)}
        />
      </div>

      <SubmitButton className="btn-primary touch-target">Save preferences</SubmitButton>
    </FormAction>
  );
}
