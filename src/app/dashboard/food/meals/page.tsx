import { requireUser } from "@/lib/session";
import { addDays, endOfDay, startOfDay } from "@/lib/date";
import { getDefaultMeals, getFoodRange, getFoodSettings } from "@/lib/queries/food";
import { repeatedMealCandidates } from "@/lib/food/insights";
import PageHeader from "@/components/PageHeader";
import CollapsibleSection from "@/components/CollapsibleSection";
import FocusTarget from "@/components/FocusTarget";
import FoodNav from "../FoodNav";
import RepeatedMealsCard from "../RepeatedMealsCard";
import DefaultMealList from "./DefaultMealList";
import DefaultMealForm from "./DefaultMealForm";

export const metadata = { title: "Default Meals" };

export default async function DefaultMealsPage() {
  const user = await requireUser();
  const now = new Date();
  const [meals, settings, recentEntries] = await Promise.all([
    getDefaultMeals(user.id),
    getFoodSettings(user.id),
    getFoodRange(user.id, addDays(startOfDay(now), -27), endOfDay(now)),
  ]);

  const usage: Record<string, number> = {};
  for (const e of recentEntries) {
    if (e.defaultMealId) usage[e.defaultMealId] = (usage[e.defaultMealId] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader
        title="Default Meals"
        description="Meals that work for your life. Log them in one tap and add them to your weekly plan."
      >
        <FoodNav active="/dashboard/food/meals" />
      </PageHeader>

      <div className="space-y-6">
        <FocusTarget value="add">
          <CollapsibleSection variant="card" title="New Default Meal" defaultOpen={meals.length === 0}>
            <DefaultMealForm mealLabels={settings.mealLabels} />
          </CollapsibleSection>
        </FocusTarget>

        <DefaultMealList meals={meals} mealLabels={settings.mealLabels} usage={usage} />

        <RepeatedMealsCard candidates={repeatedMealCandidates(recentEntries, meals.map((m) => m.name))} />
      </div>
    </div>
  );
}
