"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import type { DefaultMealView, NutritionTargetView, RecentFood } from "@/lib/queries/food";
import type { FoodMode } from "@/lib/food/meals";
import { logWater } from "./actions";
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

  function openLog() {
    const now = new Date();
    setInitialTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setLogKey((k) => k + 1);
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
            onLogged={() => setLogOpen(false)}
          />
          <button type="button" onClick={() => setLogOpen(false)} className="btn-ghost text-xs">
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
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Logged" value={String(entries.length)} />
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

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card py-3 text-center">
      <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function WaterCard({ glasses, dayValue }: { glasses: number; dayValue: string }) {
  const { error } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <div className="card flex flex-col items-center justify-center py-3 text-center">
      <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{glasses}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Glasses of water</p>
      <button
        type="button"
        disabled={pending}
        className="btn-ghost mt-1 text-xs disabled:opacity-50"
        onClick={() => {
          const fd = new FormData();
          fd.set("day", dayValue);
          fd.set("glasses", "1");
          startTransition(async () => {
            const result = await logWater(fd);
            if (!result.ok) error(result.error);
          });
        }}
      >
        +1 glass
      </button>
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
  const calPct = Math.min(100, Math.round((totals.calories / (target.calories || 1)) * 100));
  const proteinPct = Math.min(100, Math.round((totals.protein / (target.protein || 1)) * 100));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="card">
        <p className="text-sm text-slate-500 dark:text-slate-400">Calories</p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{Math.round(totals.calories)}</p>
        <p className="text-xs text-slate-400">of {Math.round(target.calories)} kcal</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full progress-track">
          <div
            className={`h-full ${totals.calories > target.calories ? "bg-red-500" : "bg-brand-500"}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-slate-500 dark:text-slate-400">Protein</p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{Math.round(totals.protein)}g</p>
        <p className="text-xs text-slate-400">of {Math.round(target.protein)}g</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full progress-track">
          <div className="h-full bg-emerald-500" style={{ width: `${proteinPct}%` }} />
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-slate-500 dark:text-slate-400">Carbs / Fat</p>
        <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          {Math.round(totals.carbs)}g / {Math.round(totals.fat)}g
        </p>
        <p className="text-xs text-slate-400">
          target {Math.round(target.carbs)}g / {Math.round(target.fat)}g
        </p>
      </div>
      <WaterCard glasses={waterGlasses} dayValue={dayValue} />
    </div>
  );
}
