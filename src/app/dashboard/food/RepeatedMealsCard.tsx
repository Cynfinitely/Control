import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import type { RepeatedMealCandidate } from "@/lib/food/insights";
import { upsertDefaultMealForm } from "./actions";

export default function RepeatedMealsCard({ candidates }: { candidates: RepeatedMealCandidate[] }) {
  return (
    <section className="card">
      <h2 className="section-title">Meals you repeat</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Logged three or more times in the last four weeks. Save the ones that work for you as Default Meals to log them in one tap.
      </p>
      {candidates.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No repeated meals yet. Keep logging and they will show up here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
          {candidates.map((c) => (
            <li key={c.name} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {c.name} <span className="text-sm font-normal text-slate-400">· {c.count}×</span>
                </p>
                {c.items && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.items}</p>}
              </div>
              <FormAction action={upsertDefaultMealForm} successMessage="Default Meal created">
                <input type="hidden" name="name" value={c.name} />
                <input type="hidden" name="meal" value={c.meal ?? ""} />
                <input type="hidden" name="items" value={c.items ?? ""} />
                <input type="hidden" name="linkByName" value="1" />
                <SubmitButton className="btn-ghost touch-target text-sm">Make default</SubmitButton>
              </FormAction>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
