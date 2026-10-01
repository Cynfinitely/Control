"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import StatCard from "@/components/StatCard";
import type { DefaultMealView, NutritionTargetView, RecentFood } from "@/lib/queries/food";
import type { FoodMode } from "@/lib/food/meals";
import type { ActionResult } from "@/lib/action-result";
import { logWater, removeWater } from "./actions";
import QuickLog from "./QuickLog";
import FoodTimeline from "./FoodTimeline";
import type { DiaryEntry } from "./types";

type Props = {
  dayValue: string;
  dayLabel: string;
  nowTime: string;
  autoOpen: boolean;
  mode: FoodMode;
  mealLabels: string[];
  entries: DiaryEntry[];
  defaults: DefaultMealView[];
  recent: RecentFood[];
  target: NutritionTargetView;
  waterGlasses: number;
};

export default function FoodDiary(props: Props) {
  const { dayValue, dayLabel, mode, entries } = props;
  const [logOpen, setLogOpen] = useState(props.autoOpen);
  const [logKey, setLogKey] = useState(0);
  const [initialTime, setInitialTime] = useState(props.nowTime);
  // Deep links (?focus=log) always focus the name field; manual opens only on desktop.
  const [forceFocus, setForceFocus] = useState(props.autoOpen);

  function openLog() {
    const now = new Date();
    setInitialTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setLogKey((k) => k + 1);
    setForceFocus(false);
    setLogOpen(true);
  }

  return (
    <div className="space-y-6">
      {logOpen ? (
        <div className="space-y-2">
          <QuickLog
            key={logKey}
            dayValue={dayValue}
            initialTime={initialTime}
            mode={mode}
            mealLabels={props.mealLabels}
            defaults={props.defaults}
            recent={props.recent}
            forceFocus={forceFocus}
            onLogged={() => setLogOpen(false)}
          />
          <button type="button" onClick={() => setLogOpen(false)} className="btn-ghost touch-target">
            <Icon name="x" className="h-4 w-4" />
            Close
          </button>
        </div>
      ) : (
        <button type="button" onClick={openLog} className="btn-primary touch-target w-full py-3 text-base">
          <Icon name="plus" className="h-5 w-5" />
          Log food
        </button>
      )}

      {mode === "optimize" ? (
        <NutritionSummary entries={entries} target={props.target} waterGlasses={props.waterGlasses} dayValue={dayValue} />
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <StatCard label="Meals logged" value={entries.length} size="sm" />
          <WaterCard glasses={props.waterGlasses} dayValue={dayValue} />
        </div>
      )}

      <section>
        <h2 className="section-title mb-3">What did I eat {dayLabel === "Today" ? "today" : `on ${dayLabel}`}?</h2>
        <FoodTimeline entries={entries} dayValue={dayValue} mode={mode} mealLabels={props.mealLabels} />
      </section>
    </div>
  );
}

function WaterCard({ glasses, dayValue }: { glasses: number; dayValue: string }) {
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();

  function run(action: (fd: FormData) => Promise<ActionResult>, message: string) {
    const fd = new FormData();
    fd.set("day", dayValue);
    fd.set("glasses", "1");
    startTransition(async () => {
      const result = await action(fd);
      if (result.ok) success(message);
      else error(result.error);
    });
  }

  return (
    <div className="card min-w-0 p-4">
      <p className="text-xs text-slate-600 dark:text-slate-400">Glasses of water</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100" aria-live="polite">
          {glasses}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending || glasses <= 0}
            onClick={() => run(removeWater, "Removed 1 glass")}
            className="btn-icon ring-1 ring-inset ring-slate-200 disabled:opacity-40 dark:ring-slate-700"
            aria-label="Remove 1 glass of water"
            title="Remove 1 glass"
          >
            <Icon name="minus" className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(logWater, "Added 1 glass")}
            className="btn-ghost touch-target"
          >
            <Icon name="plus" className="h-4 w-4" />
            1 glass
          </button>
        </div>
      </div>
    </div>
  );
}

function NutritionSummary({
  entries,
  target,
  waterGlasses,
  dayValue,
}: {
  entries: DiaryEntry[];
  target: NutritionTargetView;
  waterGlasses: number;
  dayValue: string;
}) {
  const totals = entries.reduce(
    (s, e) => ({
      calories: s.calories + e.calories,
      protein: s.protein + e.protein,
      carbs: s.carbs + e.carbs,
      fat: s.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const calPct = (totals.calories / (target.calories || 1)) * 100;
  const proteinPct = (totals.protein / (target.protein || 1)) * 100;
  const overCalories = totals.calories > target.calories;
  const proteinReached = target.protein > 0 && totals.protein >= target.protein;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Calories"
        value={Math.round(totals.calories)}
        hint={`of ${Math.round(target.calories)} kcal`}
        progress={calPct}
        tone={overCalories ? "bad" : "default"}
        status={overCalories ? `Over by ${Math.round(totals.calories - target.calories)} kcal` : undefined}
      />
      <StatCard
        label="Protein"
        value={`${Math.round(totals.protein)}g`}
        hint={`of ${Math.round(target.protein)}g`}
        progress={proteinPct}
        tone={proteinReached ? "good" : "default"}
        status={proteinReached ? "Target reached" : undefined}
      />
      <StatCard
        label="Carbs / Fat"
        value={`${Math.round(totals.carbs)}g / ${Math.round(totals.fat)}g`}
        hint={`target ${Math.round(target.carbs)}g / ${Math.round(target.fat)}g`}
      />
      <WaterCard glasses={waterGlasses} dayValue={dayValue} />
    </div>
  );
}
