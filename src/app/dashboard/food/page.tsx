import Link from "next/link";
import { requireUser } from "@/lib/session";
import { addDays, endOfDay, formatDayLabel, parseDayParam, startOfDay, startOfWeek, toDateInputValue } from "@/lib/date";
import {
  getDayFoodEntries,
  getDefaultMeals,
  getFoodRange,
  getFoodSettings,
  getRecentFoods,
  getUserTimezone,
} from "@/lib/queries/food";
import { repeatedMealCandidates, timeInZone, weeklyFoodSummary, weeklyObservations } from "@/lib/food/insights";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import FoodNav from "./FoodNav";
import FoodDiary from "./FoodDiary";
import RepeatedMealsCard from "./RepeatedMealsCard";
import type { DiaryEntry } from "./types";

export default async function FoodPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const weekStart = startOfWeek(day);

  const [dayData, settings, defaults, recent, timeZone, weekEntries] = await Promise.all([
    getDayFoodEntries(user.id, dayValue),
    getFoodSettings(user.id),
    getDefaultMeals(user.id),
    getRecentFoods(user.id),
    getUserTimezone(user.id),
    getFoodRange(user.id, weekStart, endOfDay(addDays(weekStart, 6))),
  ]);

  const repeatEntries =
    settings.mode === "observe"
      ? []
      : await getFoodRange(user.id, addDays(startOfDay(new Date()), -27), endOfDay(new Date()));

  const entries: DiaryEntry[] = dayData.entries.map((e) => ({
    ...e,
    timeLabel: e.eatenAt ? timeInZone(e.eatenAt, timeZone) : null,
  }));
  const defaultNames = new Map(defaults.map((d) => [d.id, d.name]));
  const observations = weeklyObservations(
    weeklyFoodSummary(weekEntries, { timeZone, defaultMealNames: defaultNames })
  ).slice(0, 3);

  return (
    <div>
      <PageHeader title="Food" description="Make eating visible. Log what you eat, no numbers required." />
      <FoodNav active="/dashboard/food" />

      <div className="mb-6">
        <DayNavigator basePath="/dashboard/food" dayValue={dayValue} dayLabel={dayLabel} />
      </div>

      <FoodDiary
        dayValue={dayValue}
        dayLabel={dayLabel}
        nowTime={timeInZone(new Date(), timeZone)}
        autoOpen={searchParams.focus === "log"}
        mode={settings.mode}
        mealLabels={settings.mealLabels}
        entries={entries}
        defaults={defaults}
        recent={recent}
        target={dayData.target}
        waterGlasses={dayData.waterGlasses}
      />

      <div className="mt-8 space-y-6">
        {settings.mode !== "observe" && (
          <RepeatedMealsCard candidates={repeatedMealCandidates(repeatEntries, defaults.map((d) => d.name))} />
        )}

        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">This week</h2>
            <Link href="/dashboard/food/week" className="text-sm font-medium text-brand-600 dark:text-brand-400">
              Weekly report →
            </Link>
          </div>
          {observations.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Observations appear once you log a few meals.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {observations.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
