import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  startOfDay,
  toDateInputValue,
  formatDayLabel,
  parseDayParam,
} from "@/lib/date";
import { getDayFoodEntries } from "@/lib/queries/food";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import FormAction from "@/components/FormAction";
import { logFoodForm, deleteFood, saveTarget, logWater } from "./actions";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default async function FoodPage({
  searchParams,
}: {
  searchParams: { day?: string };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const { entries, target, waterGlasses } = await getDayFoodEntries(user.id, dayValue);

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = entries.reduce((s, e) => s + e.fat, 0);
  const calorieTarget = target?.calories ?? 2000;
  const proteinTarget = target?.protein ?? 120;
  const calPct = Math.min(100, Math.round((totalCalories / (calorieTarget || 1)) * 100));
  const proteinPct = Math.min(100, Math.round((totalProtein / (proteinTarget || 1)) * 100));

  return (
    <div>
      <PageHeader
        title="Food diary"
        description="Log what you eat — calories, macros, and water."
        action={
          <Link href="/dashboard/food/planner" className="btn-ghost touch-target">
            Meal planner →
          </Link>
        }
      />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator basePath="/dashboard/food" dayValue={dayValue} dayLabel={dayLabel} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Calories</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(totalCalories)}</p>
          <p className="text-xs text-slate-400">of {Math.round(calorieTarget)} kcal</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${totalCalories > calorieTarget ? "bg-red-500" : "bg-brand-500"}`}
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Protein</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{Math.round(totalProtein)}g</p>
          <p className="text-xs text-slate-400">of {Math.round(proteinTarget)}g</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-emerald-500" style={{ width: `${proteinPct}%` }} />
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Carbs / Fat</p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {Math.round(totalCarbs)}g / {Math.round(totalFat)}g
          </p>
          <p className="text-xs text-slate-400">
            target {Math.round(target?.carbs ?? 220)}g / {Math.round(target?.fat ?? 70)}g
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Water</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{waterGlasses}</p>
          <p className="text-xs text-slate-400">glasses today</p>
          <form action={logWater} className="mt-2 flex gap-1">
            <input type="hidden" name="date" value={dayValue} />
            <input type="hidden" name="glasses" value="1" />
            <SubmitButton className="btn-ghost text-xs">+1 glass</SubmitButton>
          </form>
        </div>
      </div>

      <FormAction action={logFoodForm} successMessage="Meal logged" className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="food-name" className="label">Food</label>
          <input id="food-name" name="name" className="input" placeholder="e.g. Chicken salad" required />
        </div>
        <div>
          <label className="label">Calories</label>
          <input name="calories" type="number" step="any" className="input" required />
        </div>
        <div>
          <label className="label">Meal</label>
          <select name="meal" className="input" defaultValue="lunch">
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Protein (g)</label>
          <input name="protein" type="number" step="any" className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label">Carbs (g)</label>
          <input name="carbs" type="number" step="any" className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label">Fat (g)</label>
          <input name="fat" type="number" step="any" className="input" defaultValue={0} />
        </div>
        <div>
          <label className="label">Date</label>
          <input name="date" type="date" className="input" defaultValue={dayValue} />
        </div>
        <div className="flex items-end">
          <SubmitButton className="btn-primary touch-target w-full">Log food</SubmitButton>
        </div>
      </FormAction>

      <h2 className="section-title mb-3">{dayLabel}&apos;s entries</h2>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-slate-400">No food logged for this day.</p>}
        {entries.map((e) => (
          <div key={e.id} className="card flex items-center gap-3 py-3">
            <span className="badge bg-slate-100 capitalize text-slate-500">{e.meal}</span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{e.name}</p>
              <p className="text-xs text-slate-400">
                {Math.round(e.calories)} kcal
                {(e.protein > 0 || e.carbs > 0 || e.fat > 0) &&
                  ` · P${Math.round(e.protein)} C${Math.round(e.carbs)} F${Math.round(e.fat)}`}
              </p>
            </div>
            <form action={deleteFood}>
              <input type="hidden" name="id" value={e.id} />
              <SubmitIconButton
                className="touch-target text-slate-300 hover:text-red-500"
                title="Delete"
                icon={<Icon name="trash" className="h-4 w-4" />}
              />
            </form>
          </div>
        ))}
      </div>

      <details className="card mt-8">
        <summary className="cursor-pointer font-medium text-slate-700">Nutrition targets</summary>
        <form action={saveTarget} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Calories</label>
            <input name="calories" type="number" step="any" className="input" defaultValue={calorieTarget} />
          </div>
          <div>
            <label className="label">Protein (g)</label>
            <input name="protein" type="number" step="any" className="input" defaultValue={proteinTarget} />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input name="carbs" type="number" step="any" className="input" defaultValue={target?.carbs ?? 220} />
          </div>
          <div>
            <label className="label">Fat (g)</label>
            <input name="fat" type="number" step="any" className="input" defaultValue={target?.fat ?? 70} />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <SubmitButton className="btn-primary touch-target">Save targets</SubmitButton>
          </div>
        </form>
      </details>
    </div>
  );
}
