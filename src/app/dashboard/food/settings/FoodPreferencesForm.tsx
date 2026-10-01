"use client";

import { useState } from "react";
import clsx from "clsx";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import Icon from "@/components/Icon";
import { FOOD_MODES, FOOD_MODE_INFO, MEAL_LABEL_PRESETS, type FoodMode } from "@/lib/food/meals";
import { saveFoodPreferencesForm } from "../actions";

export default function FoodPreferencesForm({ mode, mealLabels }: { mode: FoodMode; mealLabels: string[] }) {
  const [selectedMode, setSelectedMode] = useState<FoodMode>(mode);
  const [labels, setLabels] = useState(mealLabels.join("\n"));

  return (
    <FormAction action={saveFoodPreferencesForm} successMessage="Preferences saved" className="card space-y-6">
      <fieldset>
        <legend className="section-title mb-1">Mode</legend>
        <p className="mb-3 text-sm text-muted">
          Modes only change what the diary emphasizes. Everything you log is kept either way.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {FOOD_MODES.map((m) => (
            <label
              key={m}
              className={clsx(
                "relative block cursor-pointer rounded-lg p-3 pr-10 ring-1 ring-inset transition",
                "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500",
                selectedMode === m
                  ? "bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-950"
                  : "ring-slate-200 hover:bg-slate-50 dark:ring-slate-600 dark:hover:bg-slate-700/60"
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2",
                  selectedMode === m
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 dark:border-slate-500"
                )}
              >
                {selectedMode === m && <Icon name="check" className="h-3 w-3" />}
              </span>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={selectedMode === m}
                onChange={() => setSelectedMode(m)}
                className="sr-only"
              />
              <span className="block font-medium text-slate-800 dark:text-slate-100">{FOOD_MODE_INFO[m].label}</span>
              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                {FOOD_MODE_INFO[m].description}
              </span>
              {selectedMode === m && <span className="mt-2 block text-xs font-semibold text-brand-700 dark:text-brand-300">Selected</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="meal-labels" className="section-title mb-1 block">
          Meal labels
        </label>
        <p id="meal-labels-hint" className="mb-3 text-sm text-muted">
          One per line. Use whatever matches how you actually eat. Past entries keep their label.
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Fill with a preset:</span>
          {MEAL_LABEL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn-ghost btn-sm min-h-[36px]"
              onClick={() => setLabels(preset.labels.join("\n"))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <textarea
          id="meal-labels"
          aria-describedby="meal-labels-hint"
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
