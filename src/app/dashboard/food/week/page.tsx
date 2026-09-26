import Link from "next/link";
import { requireUser } from "@/lib/session";
import { addDays, endOfDay, formatDate, parseDayParam, startOfWeek, toDateInputValue } from "@/lib/date";
import { getDefaultMeals, getFoodRange, getUserTimezone } from "@/lib/queries/food";
import {
  type CountedLabel,
  formatMinutes,
  weeklyFoodSummary,
  weeklyObservations,
} from "@/lib/food/insights";
import PageHeader from "@/components/PageHeader";
import CollapsibleSection from "@/components/CollapsibleSection";
import FoodNav from "../FoodNav";

export default async function FoodWeekPage({ searchParams }: { searchParams: { week?: string } }) {
  const user = await requireUser();
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

  const weekHref = (d: Date) => `/dashboard/food/week?week=${toDateInputValue(d)}`;

  return (
    <div>
      <PageHeader
        title="Weekly food report"
        description={`${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`}
      />
      <FoodNav active="/dashboard/food/week" />

      <div className="mb-6 flex items-center gap-2">
        <Link href={weekHref(addDays(weekStart, -7))} className="btn-ghost touch-target px-3" aria-label="Previous week">
          ←
        </Link>
        {!isCurrentWeek && (
          <>
            <Link href={weekHref(addDays(weekStart, 7))} className="btn-ghost touch-target px-3" aria-label="Next week">
              →
            </Link>
            <Link href="/dashboard/food/week" className="btn-ghost text-xs">
              This week
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Days logged" value={`${summary.daysLogged}/${summary.daysInPeriod}`} />
        <Stat label="Meals logged" value={String(summary.totalMeals)} />
        <Stat label="Snack days" value={String(summary.snackDays)} />
        <Stat label="Default Meal uses" value={String(summary.defaultMealUses)} />
      </div>

      <section className="card mt-6">
        <h2 className="section-title mb-2">Observations</h2>
        {observations.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing logged this week yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {observations.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RankedList title="Most frequent meals" rows={summary.topMeals} empty="No meals logged." />
        <RankedList
          title="Frequent foods"
          rows={summary.topFoods}
          empty="Add what was in a meal (e.g. “rye bread, skyr”) to see foods here."
        />
        <section className="card">
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

      {nutrition && (
        <div className="card mt-6">
          <CollapsibleSection title="Nutrition">
            <p className="mb-3 text-xs text-slate-400">
              Based on {nutrition.daysWithData} {nutrition.daysWithData === 1 ? "day" : "days"} with nutrition data.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Avg kcal / day" value={String(Math.round(nutrition.calories / nutrition.daysWithData))} />
              <Stat label="Avg protein / day" value={`${Math.round(nutrition.protein / nutrition.daysWithData)}g`} />
              <Stat label="Avg carbs / day" value={`${Math.round(nutrition.carbs / nutrition.daysWithData)}g`} />
              <Stat label="Avg fat / day" value={`${Math.round(nutrition.fat / nutrition.daysWithData)}g`} />
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-3 text-center">
      <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function RankedList({ title, rows, empty }: { title: string; rows: CountedLabel[]; empty: string }) {
  return (
    <section className="card">
      <h2 className="section-title mb-2">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex justify-between gap-3 text-slate-700 dark:text-slate-200">
              <span className="min-w-0 truncate">{r.label}</span>
              <span className="shrink-0 tabular-nums text-slate-400">
                {r.count}× · {r.days} {r.days === 1 ? "day" : "days"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
