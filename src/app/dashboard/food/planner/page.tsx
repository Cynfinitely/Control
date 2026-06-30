import Link from "next/link";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate, startOfWeek, addDays } from "@/lib/date";
import { getWeekMealPlan } from "@/lib/queries/food-planner";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import {
  addPlanItem,
  deletePlanItem,
  addShoppingItem,
  toggleShoppingItem,
} from "../actions";

const MEALS = ["breakfast", "lunch", "dinner", "snack"];

export default async function PlannerPage() {
  const user = await requireUser();
  const weekStart = startOfWeek(new Date());
  const weekStartKey = toDateInputValue(weekStart);

  const items = await getWeekMealPlan(user.id, weekStartKey);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = (d: Date) =>
    items.filter((it) => toDateInputValue(it.date) === toDateInputValue(d));

  // Aggregate shopping list across the whole week
  const shopping = items.flatMap((it) =>
    it.ingredients.map((g) => ({ ...g, meal: it.name }))
  );
  const remaining = shopping.filter((s) => !s.checked).length;

  return (
    <div>
      <PageHeader
        title="Meal planner"
        description={`Week of ${formatDate(weekStart)} - ${formatDate(addDays(weekStart, 6))}`}
        action={
          <Link href="/dashboard/food" className="btn-ghost">
            ← Food diary
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {days.map((d) => {
          const dayItems = byDay(d);
          return (
            <div key={d.toISOString()} className="card">
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
              </p>
              <div className="space-y-2">
                {dayItems.map((it) => (
                  <div key={it.id} className="rounded-md bg-slate-50 p-2 text-xs">
                    <div className="flex items-start justify-between">
                      <span className="font-medium capitalize text-slate-600">{it.meal}</span>
                      <form action={deletePlanItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <SubmitIconButton
                          className="text-slate-300 hover:text-red-500"
                          icon={<Icon name="trash" className="h-3 w-3" />}
                        />
                      </form>
                    </div>
                    <p className="text-slate-800">{it.name}</p>
                    {it.ingredients.length > 0 && (
                      <p className="mt-1 text-slate-400">{it.ingredients.length} items</p>
                    )}
                    <details className="mt-1">
                      <summary className="cursor-pointer text-brand-600">+ item</summary>
                      <form action={addShoppingItem} className="mt-1 space-y-1">
                        <input type="hidden" name="mealPlanItemId" value={it.id} />
                        <input name="name" className="input py-1 text-xs" placeholder="ingredient" required />
                        <input name="quantity" className="input py-1 text-xs" placeholder="qty (optional)" />
                        <SubmitButton className="btn-primary w-full py-1 text-xs">Add</SubmitButton>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium text-brand-600">
                  + add meal
                </summary>
                <form action={addPlanItem} className="mt-2 space-y-1">
                  <input type="hidden" name="date" value={toDateInputValue(d)} />
                  <select name="meal" className="input py-1 text-xs" defaultValue="breakfast">
                    {MEALS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input name="name" className="input py-1 text-xs" placeholder="meal name" required />
                  <SubmitButton className="btn-primary w-full py-1 text-xs">Add meal</SubmitButton>
                </form>
              </details>
            </div>
          );
        })}
      </div>

      <h2 className="section-title mb-3 mt-8">
        Shopping list <span className="text-sm font-normal text-slate-400">({remaining} to buy)</span>
      </h2>
      <div className="card">
        {shopping.length === 0 && (
          <p className="text-sm text-slate-400">
            Add ingredients to planned meals and they will appear here.
          </p>
        )}
        <div className="space-y-1">
          {shopping.map((s) => (
            <form key={s.id} action={toggleShoppingItem} className="flex items-center gap-3">
              <input type="hidden" name="id" value={s.id} />
              <SubmitIconButton
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  s.checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"
                }`}
                icon={s.checked ? <Icon name="check" className="h-3 w-3" /> : null}
              />
              <span className={`text-sm ${s.checked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                {s.name}
                {s.quantity && <span className="text-slate-400"> · {s.quantity}</span>}
                <span className="ml-2 text-xs text-slate-300">({s.meal})</span>
              </span>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
