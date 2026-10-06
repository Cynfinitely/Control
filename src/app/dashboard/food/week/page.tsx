import { requireModule } from "@/lib/session";
import { addDays, endOfDay, parseDayParam, startOfWeek, toDateInputValue } from "@/lib/date";
import { getDefaultMeals, getFoodRange, getUserTimezone } from "@/lib/queries/food";
import {
  type CountedLabel,
  formatMinutes,
  weeklyFoodSummary,
  weeklyObservations,
} from "@/lib/food/insights";
import PageHeader from "@/components/PageHeader";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";
import WeekNavigator from "@/components/WeekNavigator";
import FoodNav from "../FoodNav";

export const metadata = { title: "Food · Week summary" };

export default async function FoodWeekPage({ searchParams }: { searchParams: { week?: string } }) {
  const user = await requireModule("food");
  const weekStart = startOfWeek(parseDayParam(searchParams.week));
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const currentWeekStart = startOfWeek(new Date());
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  const [entries, defaults, timeZone] = await Promise.all([
    getFoodRange(user.id, weekStart, weekEnd),
    getDefaultMeals(user.id),
    getUserTimezone(user.id),
  ]);

  const summary = weeklyFoodSummary(entries, {
    timeZone,
    defaultMealNames: new Map(defaults.map((d) => [d.id, d.name])),
  });
  const observations = weeklyObservations(summary, isCurrentWeek ? "this week" : "that week");
  const firstMeal = summary.firstMealWindow;
  const nutrition = summary.nutrition;

  return (
    <div>
      <PageHeader
        title="Week summary"
        description="One week at a glance: what you ate, when, and which meals you repeat. For trends over any range, see Trends."
      >
        <FoodNav active="/dashboard/food/week" />
      </PageHeader>

      <div className="mb-6">
        <WeekNavigator basePath="/dashboard/food/week" weekValue={toDateInputValue(weekStart)} noFuture />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard size="sm" label="Days logged" value={`${summary.daysLogged}/${summary.daysInPeriod}`} />
        <StatCard size="sm" label="Meals logged" value={summary.totalMeals} />
        <StatCard size="sm" label="Snack days" value={summary.snackDays} />
        <StatCard size="sm" label="Default Meal uses" value={summary.defaultMealUses} />
      </div>

      <section className="card mt-6">
        <h2 className="section-title mb-2">Observations</h2>
        {observations.length === 0 ? (
          <EmptyState
            variant="inline"
            headingLevel="h3"
            icon="food"
            title={isCurrentWeek ? "Nothing logged this week yet" : "Nothing logged that week"}
            actionLabel={isCurrentWeek ? "Log food" : undefined}
            actionHref={isCurrentWeek ? "/dashboard/food?focus=log" : undefined}
          />
        ) : (
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {observations.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </section>

      {summary.totalMeals > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <RankedList title="Most frequent meals" rows={summary.topMeals} empty="No meals logged." />
          <RankedList
            title="Frequent foods"
            rows={summary.topFoods}
            empty="Add what was in a meal (e.g. “rye bread, skyr”) to see foods here."
          />
          <section className="card min-w-0">
            <h2 className="section-title mb-2">Timing</h2>
            <dl className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between gap-3">
                <dt>First meal usually</dt>
                <dd className="tabular-nums">
                  {firstMeal
                    ? firstMeal.fromMin === firstMeal.toMin
                      ? `around ${formatMinutes(firstMeal.fromMin)}`
                      : `${formatMinutes(firstMeal.fromMin)}–${formatMinutes(firstMeal.toMin)}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Snacks logged</dt>
                <dd className="tabular-nums">{summary.snackCount}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Days with snacks after 20:00</dt>
                <dd className="tabular-nums">{summary.lateSnackDays}</dd>
              </div>
            </dl>
          </section>
          <RankedList
            title="Default Meal usage"
            rows={summary.topDefaultMeals}
            empty="No Default Meals logged this week."
          />
        </div>
      )}

      {nutrition && (
        <div className="card mt-6">
          <CollapsibleSection title="Nutrition" as="h2">
            <p className="mb-3 text-xs text-muted">
              Based on {nutrition.daysWithData} {nutrition.daysWithData === 1 ? "day" : "days"} with nutrition data.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard size="sm" surface="tile" label="Avg kcal / day" value={Math.round(nutrition.calories / nutrition.daysWithData)} />
              <StatCard size="sm" surface="tile" label="Avg protein / day" value={`${Math.round(nutrition.protein / nutrition.daysWithData)}g`} />
              <StatCard size="sm" surface="tile" label="Avg carbs / day" value={`${Math.round(nutrition.carbs / nutrition.daysWithData)}g`} />
              <StatCard size="sm" surface="tile" label="Avg fat / day" value={`${Math.round(nutrition.fat / nutrition.daysWithData)}g`} />
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

function RankedList({ title, rows, empty }: { title: string; rows: CountedLabel[]; empty: string }) {
  return (
    <section className="card min-w-0">
      <h2 className="section-title mb-2">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between gap-3 text-slate-700 dark:text-slate-200">
              <span className="min-w-0 truncate">{r.label}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {r.count}× · {r.days} {r.days === 1 ? "day" : "days"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
