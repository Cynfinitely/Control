"use client";

import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import type { DefaultMealView } from "@/lib/queries/food";
import { hasNutrition } from "@/lib/food/meals";
import { joinItems } from "@/lib/food/items";
import { upsertDefaultMealForm } from "../actions";
import { NutritionInputs } from "../QuickLog";

type Props = {
  meal?: DefaultMealView;
  mealLabels: string[];
  onDone?: () => void;
};

export default function DefaultMealForm({ meal, mealLabels, onDone }: Props) {
  const prefix = meal ? `dm-${meal.id}` : "dm-new";
  const labelOptions = meal?.meal && !mealLabels.includes(meal.meal) ? [...mealLabels, meal.meal] : mealLabels;

  return (
    <FormAction
      action={async (prev, fd) => {
        const result = await upsertDefaultMealForm(prev, fd);
        if (result.ok) onDone?.();
        return result;
      }}
      successMessage={meal ? "Default Meal saved" : "Default Meal created"}
      resetOnSuccess={!meal}
      className="space-y-3"
    >
      {meal && <input type="hidden" name="id" value={meal.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-name`} className="label">Name</label>
          <input
            id={`${prefix}-name`}
            name="name"
            className="input"
            placeholder="e.g. Office lunch"
            defaultValue={meal?.name}
            required
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-meal`} className="label">Meal (optional)</label>
          <select id={`${prefix}-meal`} name="meal" className="input" defaultValue={meal?.meal ?? ""}>
            <option value="">—</option>
            {labelOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${prefix}-items`} className="label">Items</label>
        <textarea
          id={`${prefix}-items`}
          name="items"
          rows={2}
          className="input"
          placeholder="chicken, salad, skyr, fruit"
          defaultValue={meal ? joinItems(meal.items.map((i) => i.name)) : ""}
        />
        <p className="mt-1 text-xs text-slate-400">Separate with commas. Items go to the shopping list when you plan this meal.</p>
      </div>
      <CollapsibleSection title="Nutrition (optional)" defaultOpen={Boolean(meal && hasNutrition(meal))}>
        <NutritionInputs idPrefix={prefix} values={meal} />
      </CollapsibleSection>
      <SubmitButton className="btn-primary touch-target">{meal ? "Save" : "Create Default Meal"}</SubmitButton>
    </FormAction>
  );
}
