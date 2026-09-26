"use client";

import { useRef, useState, useTransition } from "react";
import clsx from "clsx";
import CollapsibleSection from "@/components/CollapsibleSection";
import { useToast } from "@/components/Toast";
import type { DefaultMealView, RecentFood } from "@/lib/queries/food";
import { displayMealLabel, type FoodMode } from "@/lib/food/meals";
import { joinItems } from "@/lib/food/items";
import type { ActionResult } from "@/lib/action-result";
import { logDefaultMeal, logFood } from "./actions";

export const HUNGER_LEVELS: { value: number; label: string }[] = [
  { value: 1, label: "Not hungry" },
  { value: 2, label: "A little" },
  { value: 3, label: "Hungry" },
  { value: 4, label: "Very" },
  { value: 5, label: "Starving" },
];

type Props = {
  dayValue: string;
  initialTime: string;
  mode: FoodMode;
  mealLabels: string[];
  defaults: DefaultMealView[];
  recent: RecentFood[];
  onLogged: () => void;
};

export default function QuickLog({ dayValue, initialTime, mode, mealLabels, defaults, recent, onLogged }: Props) {
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [time, setTime] = useState(initialTime);
  const [meal, setMeal] = useState<string | null>(null);
  const [hunger, setHunger] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    fd.set("day", dayValue);
    fd.set("time", time);
    startTransition(async () => {
      const result = await action(fd);
      if (result.ok) {
        success(result.message ?? "Logged");
        formRef.current?.reset();
        setMeal(null);
        setHunger(null);
        onLogged();
      } else {
        error(result.error);
      }
    });
  }

  function logDefault(d: DefaultMealView) {
    const fd = new FormData();
    fd.set("defaultMealId", d.id);
    run(logDefaultMeal, fd);
  }

  function logRecent(r: RecentFood) {
    const fd = new FormData();
    fd.set("name", r.name);
    if (r.meal) fd.set("meal", r.meal);
    if (r.items) fd.set("items", r.items);
    run(logFood, fd);
  }

  return (
    <div className="card space-y-4">
      {(defaults.length > 0 || recent.length > 0) && (
        <div className="space-y-3">
          {defaults.length > 0 && (
            <ChipRow label="Default Meals">
              {defaults.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={pending}
                  onClick={() => logDefault(d)}
                  title={joinItems(d.items.map((i) => i.name))}
                  className="touch-target rounded-full bg-brand-50 px-3 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800"
                >
                  {d.name}
                </button>
              ))}
            </ChipRow>
          )}
          {recent.length > 0 && (
            <ChipRow label="Recent">
              {recent.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  disabled={pending}
                  onClick={() => logRecent(r)}
                  title={r.items ?? undefined}
                  className="btn-ghost touch-target rounded-full text-sm disabled:opacity-50"
                >
                  {r.name}
                </button>
              ))}
            </ChipRow>
          )}
          <p className="text-xs text-slate-400">Tap to log at {time}.</p>
        </div>
      )}

      <form
        ref={formRef}
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (meal) fd.set("meal", meal);
          if (hunger) fd.set("hunger", String(hunger));
          run(logFood, fd);
        }}
      >
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="quick-name" className="sr-only">What did you eat?</label>
            <input
              id="quick-name"
              name="name"
              className="input"
              placeholder="What did you eat?"
              autoComplete="off"
              autoFocus
              required
            />
          </div>
          <div className="w-28 shrink-0">
            <label htmlFor="quick-time" className="sr-only">Time</label>
            <input
              id="quick-time"
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <CollapsibleSection title="More (optional)">
          <div className="space-y-4">
            <div>
              <p className="label">Meal</p>
              <div className="flex flex-wrap gap-2">
                {mealLabels.map((label) => (
                  <ToggleChip key={label} active={meal === label} onClick={() => setMeal(meal === label ? null : label)}>
                    {displayMealLabel(label)}
                  </ToggleChip>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="quick-items" className="label">What was in it</label>
              <input id="quick-items" name="items" className="input" placeholder="e.g. rye bread, turkey, skyr" />
            </div>
            <div>
              <p className="label">Hunger before eating</p>
              <div className="flex flex-wrap gap-2">
                {HUNGER_LEVELS.map((h) => (
                  <ToggleChip
                    key={h.value}
                    active={hunger === h.value}
                    onClick={() => setHunger(hunger === h.value ? null : h.value)}
                  >
                    {h.label}
                  </ToggleChip>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="quick-note" className="label">Note</label>
              <input id="quick-note" name="note" className="input" maxLength={500} placeholder="Where, with whom, how it felt" />
            </div>
            <CollapsibleSection title="Nutrition" defaultOpen={mode === "optimize"}>
              <NutritionInputs idPrefix="quick" />
            </CollapsibleSection>
          </div>
        </CollapsibleSection>

        <button type="submit" disabled={pending} className="btn-primary touch-target w-full disabled:opacity-50">
          {pending ? "Logging…" : "Log food"}
        </button>
      </form>
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx("btn-ghost touch-target rounded-full text-sm", active && "ring-2 ring-brand-500")}
    >
      {children}
    </button>
  );
}

export function NutritionInputs({
  idPrefix,
  values,
}: {
  idPrefix: string;
  values?: { calories: number; protein: number; carbs: number; fat: number };
}) {
  const fields = [
    { name: "calories", label: "Calories" },
    { name: "protein", label: "Protein (g)" },
    { name: "carbs", label: "Carbs (g)" },
    { name: "fat", label: "Fat (g)" },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${idPrefix}-${f.name}`} className="label">{f.label}</label>
          <input
            id={`${idPrefix}-${f.name}`}
            name={f.name}
            type="number"
            step="any"
            min={0}
            className="input"
            defaultValue={values && values[f.name] > 0 ? values[f.name] : undefined}
          />
        </div>
      ))}
    </div>
  );
}
