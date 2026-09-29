import { requireUser } from "@/lib/session";
import { formatDate, toDateInputValue } from "@/lib/date";
import { parseFoodRange, type FoodRangeSearchParams } from "@/lib/food/range";
import { buildFoodRangePrompt } from "@/lib/food/prompt";
import { DEFAULT_NUTRITION_TARGETS, summarizeFoodRange } from "@/lib/food/summary";
import { getFoodReportRange } from "@/lib/queries/food";
import PageHeader from "@/components/PageHeader";
import FoodNav from "../FoodNav";
import FoodRangeNavigator from "../FoodRangeNavigator";
import FoodAiPromptButton from "../FoodAiPromptButton";

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
  const user = await requireUser();
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
      <PageHeader
        title="Food report"
        description="Totals, daily targets, and a copy-ready prompt for the selected dates."
      />
      <FoodNav active="/dashboard/food/report" />

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Days logged</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {summary.loggedDays}
            <span className="text-base font-medium text-slate-400"> / {summary.dayCount}</span>
          </p>
          <p className="text-xs text-slate-400">days with food</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg calories</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {Math.round(summary.averages.calories)}
          </p>
          <p className="text-xs text-slate-400">of {Math.round(targets.calories)} kcal / logged day</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg protein</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {Math.round(summary.averages.protein)}g
          </p>
          <p className="text-xs text-slate-400">of {Math.round(targets.protein)}g / logged day</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg carbs / fat</p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            {Math.round(summary.averages.carbs)}g / {Math.round(summary.averages.fat)}g
          </p>
          <p className="text-xs text-slate-400">
            target {Math.round(targets.carbs)}g / {Math.round(targets.fat)}g
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Water</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totals.waterGlasses}</p>
          <p className="text-xs text-slate-400">glasses in this range</p>
        </div>
      </div>

      <h2 className="section-title mb-3">Daily totals</h2>
      <div className="card mb-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500 dark:text-slate-400">
              <th className="pb-2 pr-3 font-medium">Date</th>
              <th className="pb-2 pr-3 font-medium">Calories</th>
              <th className="pb-2 pr-3 font-medium">Protein</th>
              <th className="pb-2 pr-3 font-medium">Carbs</th>
              <th className="pb-2 pr-3 font-medium">Fat</th>
              <th className="pb-2 pr-3 font-medium">Water</th>
              <th className="pb-2 font-medium">Vs target</th>
            </tr>
          </thead>
          <tbody>
            {summary.days.map((day) => (
              <tr key={day.dayKey} className="border-t border-slate-100 dark:border-slate-700">
                <td className="py-2 pr-3 text-slate-800 dark:text-slate-100">{formatDate(day.date)}</td>
                <td className="py-2 pr-3">{day.logged ? Math.round(day.calories) : "—"}</td>
                <td className="py-2 pr-3">{day.logged ? `${Math.round(day.protein)}g` : "—"}</td>
                <td className="py-2 pr-3">{day.logged ? `${Math.round(day.carbs)}g` : "—"}</td>
                <td className="py-2 pr-3">{day.logged ? `${Math.round(day.fat)}g` : "—"}</td>
                <td className="py-2 pr-3">{day.waterGlasses}</td>
                <td className="py-2 text-slate-500 dark:text-slate-400">{dayStatus(day)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title mb-3">Entries</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">No food logged for this range.</p>
      ) : (
        <div className="space-y-4">
          {summary.days
            .filter((day) => day.entries.length > 0)
            .map((day) => (
              <div key={day.dayKey}>
                <h3 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">{formatDate(day.date)}</h3>
                <div className="space-y-2">
                  {day.entries.map((entry, index) => (
                    <div key={`${day.dayKey}-${index}`} className="card flex items-start gap-3 py-3">
                      <span className="badge-muted mt-0.5 capitalize">{entry.meal}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{entry.name}</p>
                        <p className="text-xs text-slate-400">
                          {Math.round(entry.calories)} kcal
                          {(entry.protein > 0 || entry.carbs > 0 || entry.fat > 0) &&
                            ` · P${Math.round(entry.protein)} C${Math.round(entry.carbs)} F${Math.round(entry.fat)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
