import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPeriodKey, periodLabel, type GoalPeriod } from "@/lib/period";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { createGoal, toggleGoalComplete, incrementGoal, deleteGoal } from "./actions";

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

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, deletedAt: null, period, periodKey },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

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
            <button type="submit" className="btn-primary">Add goal</button>
          </div>
        </form>
      </details>

      <div className="space-y-2">
        {goals.length === 0 && (
          <p className="text-sm text-slate-400">No goals for this {period} period yet.</p>
        )}
        {active.map((g) => (
          <GoalRow key={g.id} goal={g} />
        ))}
        {completed.length > 0 && (
          <>
            <p className="section-title mt-6 text-sm text-slate-500">Completed ({completed.length})</p>
            {completed.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function GoalRow({
  goal,
}: {
  goal: {
    id: string;
    title: string;
    type: string;
    targetValue: number | null;
    currentValue: number;
    status: string;
  };
}) {
  const isDone = goal.status === "completed";

  if (goal.type === "numeric") {
    const target = goal.targetValue ?? 1;
    return (
      <div className={`card flex flex-wrap items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
        <div className="flex-1">
          <p className={`font-medium ${isDone ? "text-slate-500 line-through" : "text-slate-800"}`}>
            {goal.title}
          </p>
          <p className="text-sm text-slate-400">
            {Math.round(goal.currentValue)} / {Math.round(target)}
          </p>
        </div>
        {!isDone && (
          <form action={incrementGoal}>
            <input type="hidden" name="id" value={goal.id} />
            <button type="submit" className="btn-primary touch-target min-w-[3rem]">
              +1
            </button>
          </form>
        )}
        {isDone && (
          <span className="badge bg-green-100 text-green-700">Done</span>
        )}
        <DeleteGoalButton id={goal.id} />
      </div>
    );
  }

  return (
    <div className={`card flex items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
      <form action={toggleGoalComplete}>
        <input type="hidden" name="id" value={goal.id} />
        <button
          type="submit"
          className={`touch-target flex h-6 w-6 items-center justify-center rounded border ${
            isDone
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-300 hover:border-brand-500"
          }`}
        >
          {isDone && <Icon name="check" className="h-3.5 w-3.5" />}
        </button>
      </form>
      <p className={`flex-1 ${isDone ? "text-slate-500 line-through" : "font-medium text-slate-800"}`}>
        {goal.title}
      </p>
      <DeleteGoalButton id={goal.id} />
    </div>
  );
}

function DeleteGoalButton({ id }: { id: string }) {
  return (
    <form action={deleteGoal}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="touch-target text-slate-300 hover:text-red-500" title="Delete">
        <Icon name="trash" className="h-4 w-4" />
      </button>
    </form>
  );
}
