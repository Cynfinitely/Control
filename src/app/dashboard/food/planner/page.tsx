import Link from "next/link";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate, addDays, formatDateTime } from "@/lib/date";
import { getWeekMealPlan, weekStartKeyFromParam } from "@/lib/queries/food-planner";
import { getDefaultMeals, getFoodSettings } from "@/lib/queries/food";
import { displayMealLabel, hasNutrition } from "@/lib/food/meals";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import CheckButton from "@/components/CheckButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import FormField from "@/components/FormField";
import WeekNavigator from "@/components/WeekNavigator";
import FoodNav from "../FoodNav";
import {
  addPlanItem,
  deletePlanItem,
  addShoppingItem,
  toggleShoppingItem,
  logFromPlan,
} from "../actions";

export const metadata = { title: "Meal planner" };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type PlanItem = Awaited<ReturnType<typeof getWeekMealPlan>>[number];
type DefaultMeals = Awaited<ReturnType<typeof getDefaultMeals>>;

export default async function PlannerPage({ searchParams }: { searchParams: { week?: string } }) {
  const user = await requireUser();
  const weekStartKey = weekStartKeyFromParam(searchParams.week);
  const weekStart = new Date(weekStartKey + "T00:00:00");
  const todayKey = toDateInputValue(new Date());

  const [items, defaults, settings] = await Promise.all([
    getWeekMealPlan(user.id, weekStartKey),
    getDefaultMeals(user.id),
    getFoodSettings(user.id),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = (d: Date) => items.filter((it) => toDateInputValue(it.date) === toDateInputValue(d));

  // Aggregate shopping list across the whole week
  const shopping = items.flatMap((it) => it.ingredients.map((g) => ({ ...g, meal: it.name })));
  const remaining = shopping.filter((s) => !s.checked).length;

  return (
    <div>
      <PageHeader
        title="Meal planner"
        description="Plan the week's meals. Ingredients collect into one shopping list."
      >
        <FoodNav active="/dashboard/food/planner" />
      </PageHeader>

      <div className="mb-6">
        <WeekNavigator basePath="/dashboard/food/planner" weekValue={weekStartKey} />
      </div>

      {defaults.length === 0 && (
        <p className="mb-4 text-sm text-muted">
          Tip: save meals you repeat as{" "}
          <Link href="/dashboard/food/meals" className="link font-medium">
            Default Meals
          </Link>{" "}
          to plan them in one step, ingredients included.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {days.map((d, i) => {
          const dayKey = toDateInputValue(d);
          const dayItems = byDay(d);
          const headingId = `plan-day-${dayKey}`;
          return (
            <section key={dayKey} className="card min-w-0" aria-labelledby={headingId}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 id={headingId} className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {WEEKDAYS[i]}
                </h2>
                <span className="text-sm text-muted">{formatDate(d)}</span>
                {dayKey === todayKey && <span className="badge-brand">Today</span>}
              </div>

              {dayItems.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nothing planned.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
                  {dayItems.map((it) => (
                    <PlanItemRow key={it.id} item={it} showNutrition={settings.mode === "optimize"} />
                  ))}
                </ul>
              )}

              <CollapsibleSection title="Add meal" className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-700">
                <AddMealForm
                  dayKey={dayKey}
                  dayLabel={WEEKDAYS[i]}
                  defaults={defaults}
                  mealLabels={settings.mealLabels}
                />
              </CollapsibleSection>
            </section>
          );
        })}
      </div>

      <CollapsibleSection
        title="Shopping list"
        as="h2"
        count={remaining}
        defaultOpen
        className="card mt-8"
      >
        {shopping.length === 0 ? (
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="clipboard"
            title="No ingredients yet"
            description="Add ingredients to planned meals, or plan a Default Meal, and they will appear here."
          />
        ) : (
          <>
            <p className="mb-2 text-sm text-muted">
              {remaining === 0 ? "Everything is checked off." : `${remaining} of ${shopping.length} left to buy.`}
            </p>
            <ul className="space-y-1">
              {shopping.map((s) => (
                <li key={s.id}>
                  <ActionForm action={toggleShoppingItem} successMessage={false} className="flex min-h-[44px] items-center gap-3">
                    <input type="hidden" name="id" value={s.id} />
                    <CheckButton
                      type="submit"
                      checked={s.checked}
                      label={`${s.name}${s.quantity ? `, ${s.quantity}` : ""} (for ${s.meal})`}
                    />
                    <span
                      className={`min-w-0 flex-1 break-words text-sm ${
                        s.checked
                          ? "text-slate-500 line-through dark:text-slate-400"
                          : "text-slate-700 dark:text-slate-100"
                      }`}
                    >
                      {s.name}
                      {s.quantity && <span className="text-muted"> · {s.quantity}</span>}
                      <span className="ml-2 text-xs text-muted">for {s.meal}</span>
                    </span>
                  </ActionForm>
                </li>
              ))}
            </ul>
          </>
        )}
      </CollapsibleSection>
    </div>
  );
}

function PlanItemRow({ item, showNutrition }: { item: PlanItem; showNutrition: boolean }) {
  const mealLabel = displayMealLabel(item.meal);
  return (
    <li className="py-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {mealLabel && <span className="badge-muted">{mealLabel}</span>}
            {showNutrition && hasNutrition(item) && <span>{Math.round(item.calories)} kcal</span>}
            {item.ingredients.length > 0 && (
              <span>
                {item.ingredients.length} {item.ingredients.length === 1 ? "ingredient" : "ingredients"}
              </span>
            )}
            {item.loggedAt && (
              <span className="badge-success" title={`Logged ${formatDateTime(item.loggedAt)}`}>
                <Icon name="check" className="h-3.5 w-3.5" />
                Logged
              </span>
            )}
          </div>
        </div>
        <ActionForm
          action={deletePlanItem}
          confirm={{
            title: `Remove “${item.name}” from the plan?`,
            message: "Its ingredients leave the shopping list too. Diary entries are kept.",
            confirmLabel: "Remove",
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <SubmitIconButton
            icon={<Icon name="trash" className="h-4 w-4" />}
            aria-label={`Remove “${item.name}” from the plan`}
            className="btn-icon-danger -mr-2 -mt-2"
          />
        </ActionForm>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {item.loggedAt ? (
          <ActionForm
            action={logFromPlan}
            confirm={{
              title: `Log “${item.name}” again?`,
              message: `It's already in your diary (logged ${formatDateTime(item.loggedAt)}). Logging again adds a second entry.`,
              confirmLabel: "Log again",
              variant: "default",
            }}
          >
            <input type="hidden" name="planId" value={item.id} />
            <input type="hidden" name="again" value="1" />
            <SubmitButton className="btn-ghost btn-sm min-h-[36px]" pendingLabel="Logging…">
              Log again
            </SubmitButton>
          </ActionForm>
        ) : (
          <ActionForm action={logFromPlan}>
            <input type="hidden" name="planId" value={item.id} />
            <SubmitButton className="btn-ghost btn-sm min-h-[36px]" pendingLabel="Logging…">
              <Icon name="check" className="h-4 w-4" />
              Log to diary
            </SubmitButton>
          </ActionForm>
        )}
      </div>

      <CollapsibleSection title="Add ingredient" className="mt-1 text-sm">
        <ActionForm action={addShoppingItem} resetOnSuccess className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
          <input type="hidden" name="mealPlanItemId" value={item.id} />
          <FormField label="Ingredient">
            {(_id, aria) => <input {...aria} name="name" className="input" placeholder="e.g. oats" required />}
          </FormField>
          <FormField label="Quantity (optional)">
            {(_id, aria) => <input {...aria} name="quantity" className="input" placeholder="500 g" />}
          </FormField>
          <SubmitButton className="btn-primary touch-target">Add</SubmitButton>
        </ActionForm>
      </CollapsibleSection>
    </li>
  );
}

function AddMealForm({
  dayKey,
  dayLabel,
  defaults,
  mealLabels,
}: {
  dayKey: string;
  dayLabel: string;
  defaults: DefaultMeals;
  mealLabels: string[];
}) {
  return (
    <ActionForm action={addPlanItem} resetOnSuccess className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="date" value={dayKey} />
      {defaults.length > 0 && (
        <FormField label="Default Meal" className="sm:col-span-2">
          {(_id, aria) => (
            <select {...aria} name="defaultMealId" className="input" defaultValue="">
              <option value="">Pick a Default Meal…</option>
              {defaults.map((dm) => (
                <option key={dm.id} value={dm.id}>
                  {dm.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}
      <FormField
        label={defaults.length > 0 ? "Or type a meal name" : "Meal name"}
        className="sm:col-span-2"
        required={defaults.length === 0}
      >
        {(_id, aria) => (
          <input
            {...aria}
            name="name"
            className="input"
            placeholder="e.g. Chicken wraps"
            required={defaults.length === 0}
          />
        )}
      </FormField>
      <FormField label="Meal (optional)">
        {(_id, aria) => (
          <select {...aria} name="meal" className="input" defaultValue="">
            <option value="">—</option>
            {mealLabels.map((m) => (
              <option key={m} value={m}>
                {displayMealLabel(m)}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label="Calories (optional)">
        {(_id, aria) => <input {...aria} name="calories" type="number" min={0} step="any" className="input" />}
      </FormField>
      <div className="sm:col-span-2">
        <SubmitButton className="btn-primary touch-target w-full sm:w-auto" pendingLabel="Adding…">
          Add to {dayLabel}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
