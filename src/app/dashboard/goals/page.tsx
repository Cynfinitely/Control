import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { createGoal, addCheckIn, setGoalStatus, deleteGoal } from "./actions";

export default async function GoalsPage() {
  const user = await requireUser();
  const goals = await prisma.goal.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { checkIns: { orderBy: { date: "desc" }, take: 1 } },
  });

  const active = goals.filter((g) => g.status === "active");
  const others = goals.filter((g) => g.status !== "active");

  return (
    <div>
      <PageHeader title="Goals" description="Set objectives and track progress with check-ins." />

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ Add goal</summary>
        <form action={createGoal} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input name="title" className="input" required />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="numeric">
              <option value="numeric">Numeric</option>
              <option value="boolean">Yes / No</option>
              <option value="habit">Habit</option>
            </select>
          </div>
          <div>
            <label className="label">Target date</label>
            <input name="targetDate" type="date" className="input" />
          </div>
          <div>
            <label className="label">Target value</label>
            <input name="targetValue" type="number" step="any" className="input" placeholder="e.g. 12" />
          </div>
          <div>
            <label className="label">Unit</label>
            <input name="unit" className="input" placeholder="e.g. books" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Add goal</button>
          </div>
        </form>
      </details>

      <h2 className="section-title mb-3">Active ({active.length})</h2>
      <div className="space-y-4">
        {active.length === 0 && <p className="text-sm text-slate-400">No active goals yet.</p>}
        {active.map((g) => {
          const pct =
            g.targetValue && g.targetValue > 0
              ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
              : null;
          return (
            <div key={g.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{g.title}</h3>
                  {g.description && <p className="mt-1 text-sm text-slate-500">{g.description}</p>}
                  {g.targetDate && (
                    <p className="mt-1 text-xs text-slate-400">Target: {formatDate(g.targetDate)}</p>
                  )}
                </div>
                <form action={deleteGoal}>
                  <input type="hidden" name="id" value={g.id} />
                  <button className="text-slate-300 hover:text-red-500" title="Delete">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {pct !== null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      {g.currentValue} / {g.targetValue} {g.unit ?? ""}
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-end gap-2">
                <form action={addCheckIn} className="flex items-end gap-2">
                  <input type="hidden" name="goalId" value={g.id} />
                  <div>
                    <label className="label">Update progress</label>
                    <input
                      name="value"
                      type="number"
                      step="any"
                      className="input w-32"
                      placeholder="current"
                      defaultValue={g.currentValue}
                      required
                    />
                  </div>
                  <button className="btn-ghost">Save</button>
                </form>
                <form action={setGoalStatus}>
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="status" value="completed" />
                  <button className="btn-ghost">Mark complete</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {others.length > 0 && (
        <>
          <h2 className="section-title mb-3 mt-8">Completed / Archived</h2>
          <div className="space-y-2">
            {others.map((g) => (
              <div key={g.id} className="card flex items-center justify-between py-3 opacity-75">
                <div>
                  <span className="font-medium text-slate-700">{g.title}</span>
                  <span className="ml-2 badge bg-slate-100 text-slate-500">{g.status}</span>
                </div>
                <div className="flex gap-2">
                  <form action={setGoalStatus}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="status" value="active" />
                    <button className="text-xs text-brand-600 hover:underline">Reactivate</button>
                  </form>
                  <form action={deleteGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <button className="text-slate-300 hover:text-red-500" title="Delete">
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
