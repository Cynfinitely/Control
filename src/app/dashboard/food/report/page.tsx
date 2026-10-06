import { requireModule } from "@/lib/session";
import { formatDate, toDateInputValue } from "@/lib/date";
import { parseFoodRange, type FoodRangeSearchParams } from "@/lib/food/range";
import { buildFoodRangePrompt } from "@/lib/food/prompt";
import { DEFAULT_NUTRITION_TARGETS, summarizeFoodRange } from "@/lib/food/summary";
import { getFoodReportRange } from "@/lib/queries/food";
import { displayMealLabel } from "@/lib/food/meals";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatCard from "@/components/StatCard";
import FoodNav from "../FoodNav";
import FoodRangeNavigator from "../FoodRangeNavigator";
import FoodAiPromptButton from "../FoodAiPromptButton";

export const metadata = { title: "Food · Trends" };

function dayStatus(day: {
  logged: boolean;
  overCalories: boolean;
  underProtein: boolean;
}): string {
  if (!day.logged) return "No log";
  const notes: string[] = [];
  if (day.overCalories) notes.push("Over calories");
  if (day.underProtein) notes.push("Under protein");
  return notes.length > 0 ? notes.join(", ") : "On target";
}

export default async function FoodReportPage({
  searchParams,
}: {
  searchParams: FoodRangeSearchParams;
}) {
  const user = await requireModule("food");
  const range = parseFoodRange(searchParams);
  const { entries, target, waterLogs } = await getFoodReportRange(user.id, range.from, range.to);
  const targets = {
    calories: target?.calories ?? DEFAULT_NUTRITION_TARGETS.calories,
    protein: target?.protein ?? DEFAULT_NUTRITION_TARGETS.protein,
    carbs: target?.carbs ?? DEFAULT_NUTRITION_TARGETS.carbs,
    fat: target?.fat ?? DEFAULT_NUTRITION_TARGETS.fat,
  };
  const summary = summarizeFoodRange(entries, waterLogs, range.from, range.to, targets);
  const prompt =
    entries.length > 0
      ? buildFoodRangePrompt({
          label: range.label,
          from: range.from,
          to: range.to,
          targets,
          days: summary.days,
          entries: summary.days.flatMap((day) => day.entries),
        })
      : "";

  const fromValue = toDateInputValue(range.from);
  const toValue = toDateInputValue(range.to);

  return (
    <div>
      <PageHeader help="food:trends"
        title="Trends"
        description="Totals and targets over any range you choose, plus a copy-ready AI prompt. For a single week's patterns, see Week summary."
      >
        <FoodNav active="/dashboard/food/report" />
      </PageHeader>

      <div className="card mb-6 flex flex-wrap items-start justify-between gap-4">
        <FoodRangeNavigator
          searchParams={searchParams}
          preset={range.preset}
          label={range.label}
          fromValue={fromValue}
          toValue={toValue}
          anchor={range.anchor}
        />
        {entries.length > 0 && <FoodAiPromptButton label={range.label} prompt={prompt} />}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="chart"
          title="No food logged in this range"
          description="Pick another range above, or log a few meals to see totals and trends."
          actionLabel="Log food"
          actionHref="/dashboard/food?focus=log"
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatCard
              size="sm"
              label="Days logged"
              value={`${summary.loggedDays} / ${summary.dayCount}`}
              hint="days with food"
            />
            <StatCard
              size="sm"
              label="Avg calories"
              value={Math.round(summary.averages.calories)}
              hint={`of ${Math.round(targets.calories)} kcal / logged day`}
            />
            <StatCard
              size="sm"
              label="Avg protein"
              value={`${Math.round(summary.averages.protein)}g`}
              hint={`of ${Math.round(targets.protein)}g / logged day`}
            />
            <StatCard
              size="sm"
              label="Avg carbs / fat"
              value={`${Math.round(summary.averages.carbs)}g / ${Math.round(summary.averages.fat)}g`}
              hint={`target ${Math.round(targets.carbs)}g / ${Math.round(targets.fat)}g`}
            />
            <StatCard size="sm" label="Water" value={summary.totals.waterGlasses} hint="glasses in this range" />
          </div>

          <h2 className="section-title mb-3">Daily totals</h2>
          <div className="table-wrap mb-6">
            <div className="card-flush min-w-[36rem]">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Daily totals for {range.label}</caption>
                <thead>
                  <tr className="text-xs text-slate-600 dark:text-slate-400">
                    <th scope="col" className="px-4 py-3 font-medium">Date</th>
                    <th scope="col" className="py-3 pr-3 font-medium">Calories</th>
                    <th scope="col" className="py-3 pr-3 font-medium">Protein</th>
                    <th scope="col" className="py-3 pr-3 font-medium">Carbs</th>
                    <th scope="col" className="py-3 pr-3 font-medium">Fat</th>
                    <th scope="col" className="py-3 pr-3 font-medium">Water</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Vs target</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.days.map((day) => (
                    <tr key={day.dayKey} className="border-t border-slate-100 dark:border-slate-700">
                      <th scope="row" className="whitespace-nowrap px-4 py-2 font-normal text-slate-800 dark:text-slate-100">
                        {formatDate(day.date)}
                      </th>
                      <td className="py-2 pr-3">{day.logged ? Math.round(day.calories) : "—"}</td>
                      <td className="py-2 pr-3">{day.logged ? `${Math.round(day.protein)}g` : "—"}</td>
                      <td className="py-2 pr-3">{day.logged ? `${Math.round(day.carbs)}g` : "—"}</td>
                      <td className="py-2 pr-3">{day.logged ? `${Math.round(day.fat)}g` : "—"}</td>
                      <td className="py-2 pr-3">{day.waterGlasses}</td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{dayStatus(day)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h2 className="section-title mb-3">Entries</h2>
          <div className="space-y-4">
            {summary.days
              .filter((day) => day.entries.length > 0)
              .map((day) => (
                <div key={day.dayKey}>
                  <h3 className="subsection-title mb-2">{formatDate(day.date)}</h3>
                  <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
                    {day.entries.map((entry, index) => {
                      const mealLabel = displayMealLabel(entry.meal);
                      return (
                        <li key={`${day.dayKey}-${index}`} className="flex items-start gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-medium text-slate-800 dark:text-slate-100">{entry.name}</p>
                            <p className="text-xs text-muted">
                              {Math.round(entry.calories)} kcal
                              {(entry.protein > 0 || entry.carbs > 0 || entry.fat > 0) &&
                                ` · P${Math.round(entry.protein)} C${Math.round(entry.carbs)} F${Math.round(entry.fat)}`}
                            </p>
                          </div>
                          {mealLabel && <span className="badge-muted mt-0.5 shrink-0">{mealLabel}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
