import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getPeriodKey, periodLabel, type GoalPeriod } from "@/lib/period";
import { getGoalsForPeriod } from "@/lib/queries/goals";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import GoalList from "./GoalList";
import { createGoal } from "./actions";

const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const user = await requireUser();
  const period = (PERIODS.find((p) => p.value === searchParams.period)?.value ?? "weekly") as GoalPeriod;
  const now = new Date();
  const periodKey = getPeriodKey(period, now);

  const goals = await getGoalsForPeriod(user.id, period, periodKey);

  return (
    <div>
      <PageHeader
        title="Goals"
        description={`${periodLabel(period, periodKey)} — simple checkboxes and counters.`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/dashboard/goals?period=${p.value}`}
            className={`touch-target rounded-full px-4 py-2 text-sm font-medium transition ${
              period === p.value
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ Add goal</summary>
        <form action={createGoal} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="period" value={period} />
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input name="title" className="input" placeholder="e.g. Gym 12 times" required />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="boolean">
              <option value="boolean">Checkbox (done / not done)</option>
              <option value="numeric">Counter (+1 each time)</option>
            </select>
          </div>
          <div>
            <label className="label">Target (counter only)</label>
            <input name="targetValue" type="number" min={1} className="input" placeholder="e.g. 12" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Add goal</SubmitButton>
          </div>
        </form>
      </details>

      <GoalList initialGoals={goals} />
    </div>
  );
}
