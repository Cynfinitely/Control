import Link from "next/link";
import { requireModule } from "@/lib/session";
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
import EmptyState from "@/components/EmptyState";
import FoodNav from "./FoodNav";
import FoodDiary from "./FoodDiary";
import RepeatedMealsCard from "./RepeatedMealsCard";
import type { DiaryEntry } from "./types";

export const metadata = { title: "Food" };

export default async function FoodPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireModule("food");
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const weekStart = startOfWeek(day);
  const weekValue = toDateInputValue(weekStart);
  const isCurrentWeek = weekValue === toDateInputValue(startOfWeek(new Date()));

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
  const weekHref = isCurrentWeek ? "/dashboard/food/week" : `/dashboard/food/week?week=${weekValue}`;

  return (
    <div>
      <PageHeader title="Food" description="Make eating visible. Log what you eat, no numbers required.">
        <FoodNav active="/dashboard/food" />
      </PageHeader>

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">{isCurrentWeek ? "This week so far" : "That week"}</h2>
            <Link href={weekHref} className="link text-sm font-medium">
              Week summary →
            </Link>
          </div>
          {observations.length === 0 ? (
            <EmptyState
              variant="inline"
              headingLevel="h3"
              icon="chart"
              title="No patterns yet"
              description="Observations appear once you log a few meals this week."
              className="mt-3"
            />
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
