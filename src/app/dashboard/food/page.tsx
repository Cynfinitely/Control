import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay, endOfDay, toDateInputValue } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { logFood, deleteFood, saveTarget } from "./actions";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default async function FoodPage() {
  const user = await requireUser();
  const now = new Date();
  const [entries, target] = await Promise.all([
    prisma.foodLogEntry.findMany({
      where: { userId: user.id, deletedAt: null, date: { gte: startOfDay(now), lte: endOfDay(now) } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.nutritionTarget.findUnique({ where: { userId: user.id } }),
  ]);

  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const calorieTarget = target?.calories ?? 2000;
  const calPct = Math.min(100, Math.round((totalCalories / (calorieTarget || 1)) * 100));

  return (
    <div>
      <PageHeader
        title="Food diary"
        description="Log what you eat and track calories."
        action={
          <Link href="/dashboard/food/planner" className="btn-ghost touch-target">
            Meal planner →
          </Link>
        }
      />

      <div className="card mb-6">
        <p className="text-sm text-slate-500">Calories today</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{Math.round(totalCalories)}</p>
        <p className="text-xs text-slate-400">of {Math.round(calorieTarget)} kcal</p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full ${totalCalories > calorieTarget ? "bg-red-500" : "bg-brand-500"}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
      </div>

      <form action={logFood} className="card mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="label">Food</label>
          <input name="name" className="input" placeholder="e.g. Chicken salad" required />
        </div>
        <div className="w-full sm:w-28">
          <label className="label">Calories</label>
          <input name="calories" type="number" step="any" className="input" required />
        </div>
        <div className="w-full sm:w-36">
          <label className="label">Meal</label>
          <select name="meal" className="input" defaultValue="lunch">
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-36">
          <label className="label">Date</label>
          <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
        </div>
        <SubmitButton className="btn-primary touch-target w-full sm:w-auto">Log food</SubmitButton>
      </form>

      <h2 className="section-title mb-3">Today&apos;s entries</h2>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-slate-400">No food logged today.</p>}
        {entries.map((e) => (
          <div key={e.id} className="card flex items-center gap-3 py-3">
            <span className="badge bg-slate-100 capitalize text-slate-500">{e.meal}</span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{e.name}</p>
              <p className="text-xs text-slate-400">{Math.round(e.calories)} kcal</p>
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
        <summary className="cursor-pointer font-medium text-slate-700">Daily calorie target</summary>
        <form action={saveTarget} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-40">
            <label className="label">Calories</label>
            <input name="calories" type="number" step="any" className="input" defaultValue={calorieTarget} />
          </div>
          <SubmitButton className="btn-primary touch-target">Save</SubmitButton>
        </form>
      </details>
    </div>
  );
}
