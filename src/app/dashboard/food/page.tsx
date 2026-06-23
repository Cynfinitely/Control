import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startOfDay, endOfDay, toDateInputValue } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
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

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const t = target ?? { calories: 2000, protein: 120, carbs: 220, fat: 70 };
  const calPct = Math.min(100, Math.round((totals.calories / (t.calories || 1)) * 100));

  return (
    <div>
      <PageHeader
        title="Food diary"
        description="Log meals manually and track calories against your daily target."
        action={
          <Link href="/dashboard/food/planner" className="btn-ghost">
            Meal planner →
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card sm:col-span-1">
          <p className="text-sm text-slate-500">Calories today</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{Math.round(totals.calories)}</p>
          <p className="text-xs text-slate-400">of {Math.round(t.calories)} kcal</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${totals.calories > t.calories ? "bg-red-500" : "bg-brand-500"}`}
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>
        <Macro label="Protein" value={totals.protein} target={t.protein} unit="g" />
        <Macro label="Carbs" value={totals.carbs} target={t.carbs} unit="g" />
        <Macro label="Fat" value={totals.fat} target={t.fat} unit="g" />
      </div>

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ Log food</summary>
        <form action={logFood} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Food</label>
            <input name="name" className="input" required />
          </div>
          <div>
            <label className="label">Meal</label>
            <select name="meal" className="input" defaultValue="breakfast">
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input name="quantity" className="input" placeholder="1 bowl" />
          </div>
          <div>
            <label className="label">Calories</label>
            <input name="calories" type="number" step="any" className="input" defaultValue={0} />
          </div>
          <div>
            <label className="label">Date</label>
            <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
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
          <div className="sm:col-span-3">
            <button className="btn-primary">Log food</button>
          </div>
        </form>
      </details>

      <h2 className="section-title mb-3">Today&apos;s entries</h2>
      <div className="space-y-2">
        {entries.length === 0 && <p className="text-sm text-slate-400">No food logged today.</p>}
        {entries.map((e) => (
          <div key={e.id} className="card flex items-center gap-3 py-3">
            <span className="badge bg-slate-100 text-slate-500 capitalize">{e.meal}</span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">
                {e.name} {e.quantity && <span className="text-slate-400">· {e.quantity}</span>}
              </p>
              <p className="text-xs text-slate-400">
                {Math.round(e.calories)} kcal · P{Math.round(e.protein)} C{Math.round(e.carbs)} F
                {Math.round(e.fat)}
              </p>
            </div>
            <form action={deleteFood}>
              <input type="hidden" name="id" value={e.id} />
              <button className="text-slate-300 hover:text-red-500" title="Delete">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>

      <details className="card mt-8">
        <summary className="cursor-pointer font-medium text-slate-700">Daily nutrition targets</summary>
        <form action={saveTarget} className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label">Calories</label>
            <input name="calories" type="number" step="any" className="input" defaultValue={t.calories} />
          </div>
          <div>
            <label className="label">Protein (g)</label>
            <input name="protein" type="number" step="any" className="input" defaultValue={t.protein} />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input name="carbs" type="number" step="any" className="input" defaultValue={t.carbs} />
          </div>
          <div>
            <label className="label">Fat (g)</label>
            <input name="fat" type="number" step="any" className="input" defaultValue={t.fat} />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <button className="btn-primary">Save targets</button>
          </div>
        </form>
      </details>
    </div>
  );
}

function Macro({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((value / (target || 1)) * 100));
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {Math.round(value)}
        <span className="text-sm font-normal text-slate-400">/{Math.round(target)}{unit}</span>
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
