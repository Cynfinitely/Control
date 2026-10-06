import { requireModule } from "@/lib/session";
import { getFoodSettings, getNutritionTarget } from "@/lib/queries/food";
import PageHeader from "@/components/PageHeader";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import FoodNav from "../FoodNav";
import FoodPreferencesForm from "./FoodPreferencesForm";
import { saveTargetForm } from "../actions";

export const metadata = { title: "Food settings" };

export default async function FoodSettingsPage() {
  const user = await requireModule("food");
  const [settings, target] = await Promise.all([getFoodSettings(user.id), getNutritionTarget(user.id)]);

  return (
    <div>
      <PageHeader help="food:settings" title="Food settings" description="Choose what the food diary focuses on.">
        <FoodNav active="/dashboard/food/settings" />
      </PageHeader>

      <div className="space-y-6">
        <FoodPreferencesForm mode={settings.mode} mealLabels={settings.mealLabels} />

        <div className="card">
          <CollapsibleSection title="Advanced: nutrition targets" as="h2" defaultOpen={settings.mode === "optimize"}>
            <p className="mb-3 text-sm text-muted">
              Targets are only shown on the diary in Optimize mode.
            </p>
            <FormAction
              action={saveTargetForm}
              successMessage="Targets saved"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div>
                <label htmlFor="target-calories" className="label">Calories</label>
                <input id="target-calories" name="calories" type="number" step="any" className="input" defaultValue={target.calories} />
              </div>
              <div>
                <label htmlFor="target-protein" className="label">Protein (g)</label>
                <input id="target-protein" name="protein" type="number" step="any" className="input" defaultValue={target.protein} />
              </div>
              <div>
                <label htmlFor="target-carbs" className="label">Carbs (g)</label>
                <input id="target-carbs" name="carbs" type="number" step="any" className="input" defaultValue={target.carbs} />
              </div>
              <div>
                <label htmlFor="target-fat" className="label">Fat (g)</label>
                <input id="target-fat" name="fat" type="number" step="any" className="input" defaultValue={target.fat} />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <SubmitButton className="btn-primary touch-target">Save targets</SubmitButton>
              </div>
            </FormAction>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
