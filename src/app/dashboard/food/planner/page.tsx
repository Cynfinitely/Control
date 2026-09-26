import Link from "next/link";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate, startOfWeek, addDays } from "@/lib/date";
import { getWeekMealPlan } from "@/lib/queries/food-planner";
import { getDefaultMeals, getFoodSettings } from "@/lib/queries/food";
import { displayMealLabel, hasNutrition } from "@/lib/food/meals";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import FoodNav from "../FoodNav";
import {
  addPlanItem,
  deletePlanItem,
  addShoppingItem,
  toggleShoppingItem,
  logFromPlan,
} from "../actions";

export default async function PlannerPage() {
  const user = await requireUser();
  const weekStart = startOfWeek(new Date());
  const weekStartKey = toDateInputValue(weekStart);

  const [items, defaults, settings] = await Promise.all([
    getWeekMealPlan(user.id, weekStartKey),
    getDefaultMeals(user.id),
    getFoodSettings(user.id),
  ]);

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
      />
      <FoodNav active="/dashboard/food/planner" />

      {defaults.length === 0 && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Tip: save meals you repeat as{" "}
          <Link href="/dashboard/food/meals" className="font-medium text-brand-600 dark:text-brand-400">
            Default Meals
          </Link>{" "}
          to plan them in one step, ingredients included.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {days.map((d) => {
          const dayItems = byDay(d);
          return (
            <div key={d.toISOString()} className="card">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                {d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
              </p>
              <div className="space-y-2">
                {dayItems.map((it) => (
                  <div key={it.id} className="rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-700">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{it.name}</p>
                      <form action={deletePlanItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <SubmitIconButton
                          className="text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                          icon={<Icon name="trash" className="h-3 w-3" />}
                        />
                      </form>
                    </div>
                    {it.meal && (
                      <p className="text-slate-500 dark:text-slate-400">{displayMealLabel(it.meal)}</p>
                    )}
                    {settings.mode === "optimize" && hasNutrition(it) && (
                      <p className="text-xs text-slate-400">{Math.round(it.calories)} kcal</p>
                    )}
                    {it.ingredients.length > 0 && (
                      <p className="mt-1 text-slate-400">{it.ingredients.length} items</p>
                    )}
                    <form action={logFromPlan} className="mt-1">
                      <input type="hidden" name="planId" value={it.id} />
                      <SubmitButton className="btn-ghost py-0.5 text-xs text-brand-600 dark:text-brand-400">
                        Log to diary
                      </SubmitButton>
                    </form>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-brand-600 dark:text-brand-400">+ item</summary>
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
                <summary className="cursor-pointer text-xs font-medium text-brand-600 dark:text-brand-400">
                  + add meal
                </summary>
                <form action={addPlanItem} className="mt-2 space-y-1">
                  <input type="hidden" name="date" value={toDateInputValue(d)} />
                  {defaults.length > 0 && (
                    <select name="defaultMealId" className="input py-1 text-xs" defaultValue="" aria-label="Default Meal">
                      <option value="">Pick a Default Meal…</option>
                      {defaults.map((dm) => (
                        <option key={dm.id} value={dm.id}>
                          {dm.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    name="name"
                    className="input py-1 text-xs"
                    placeholder={defaults.length > 0 ? "…or type a meal name" : "meal name"}
                    required={defaults.length === 0}
                  />
                  <details>
                    <summary className="cursor-pointer text-xs text-slate-500 dark:text-slate-400">More</summary>
                    <div className="mt-1 space-y-1">
                      <select name="meal" className="input py-1 text-xs" defaultValue="" aria-label="Meal">
                        <option value="">Meal (optional)</option>
                        {settings.mealLabels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <input name="calories" type="number" className="input py-1 text-xs" placeholder="kcal (optional)" />
                    </div>
                  </details>
                  <SubmitButton className="btn-primary w-full py-1 text-xs">Add meal</SubmitButton>
                </form>
              </details>
            </div>
          );
        })}
      </div>

      <CollapsibleSection
        title="Shopping list"
        count={remaining}
        defaultOpen
        className="card mt-8"
      >
        {shopping.length === 0 && (
          <p className="text-sm text-slate-400">
            Add ingredients to planned meals, or plan a Default Meal, and they will appear here.
          </p>
        )}
        <div className="space-y-1">
          {shopping.map((s) => (
            <form key={s.id} action={toggleShoppingItem} className="flex items-start gap-3">
              <input type="hidden" name="id" value={s.id} />
              <SubmitIconButton
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  s.checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 dark:border-slate-600"
                }`}
                icon={s.checked ? <Icon name="check" className="h-3 w-3" /> : null}
              />
              <span className={`min-w-0 flex-1 text-sm ${s.checked ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-700 dark:text-slate-100"}`}>
                {s.name}
                {s.quantity && <span className="text-slate-400"> · {s.quantity}</span>}
                <span className="ml-2 text-xs text-slate-300 dark:text-slate-600">({s.meal})</span>
              </span>
            </form>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
