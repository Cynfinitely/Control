import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getPeriodKey, periodLabel, shiftPeriodDate, type GoalPeriod } from "@/lib/period";
import { getGoalsForPeriod } from "@/lib/queries/goals";
import PageHeader from "@/components/PageHeader";
import SubmitButton from "@/components/SubmitButton";
import GoalList from "./GoalList";
import { createGoal, rolloverGoals } from "./actions";

const PERIODS: { value: GoalPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: { period?: string; offset?: string };
}) {
  const user = await requireUser();
  const period = (PERIODS.find((p) => p.value === searchParams.period)?.value ?? "weekly") as GoalPeriod;
  const offset = parseInt(searchParams.offset ?? "0", 10) || 0;
  const refDate = shiftPeriodDate(period, offset);
  const periodKey = getPeriodKey(period, refDate);
  const currentKey = getPeriodKey(period, new Date());

  const goals = await getGoalsForPeriod(user.id, period, periodKey);
  const incompleteCount = goals.filter((g) => g.status === "active").length;
  const prevOffset = offset - 1;
  const nextOffset = offset + 1;
  const canGoNext = offset < 0;

  return (
    <div>
      <PageHeader
        title="Goals"
        description={`${periodLabel(period, periodKey)} — checkboxes, counters, and milestones.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/goals?period=${period}&offset=${prevOffset}`}
            className="btn-ghost touch-target text-sm"
          >
            ← Prev
          </Link>
          <span className="text-sm font-medium text-slate-700">{periodLabel(period, periodKey)}</span>
          {canGoNext && (
            <Link
              href={`/dashboard/goals?period=${period}&offset=${nextOffset}`}
              className="btn-ghost touch-target text-sm"
            >
              Next →
            </Link>
          )}
        </div>
        {offset === -1 && incompleteCount > 0 && periodKey !== currentKey && (
          <form action={rolloverGoals}>
            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="fromPeriodKey" value={periodKey} />
            <input type="hidden" name="toPeriodKey" value={currentKey} />
            <SubmitButton className="btn-ghost text-xs">
              Carry {incompleteCount} incomplete to current period
            </SubmitButton>
          </form>
        )}
      </div>

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ Add goal</summary>
        <form action={createGoal} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="period" value={period} />
          <input type="hidden" name="periodKey" value={periodKey} />
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
            <label className="label">Auto-track from (counter only)</label>
            <select name="linkType" className="input" defaultValue="">
              <option value="">Manual only</option>
              <option value="workout">Workouts logged</option>
              <option value="learning">Learning hours logged</option>
              <option value="quran">Quran pages read</option>
            </select>
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
