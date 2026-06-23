import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { createWorkout, deleteWorkout, logWeight, logMeasurement } from "./actions";

export default async function ExercisePage() {
  const user = await requireUser();
  const now = new Date();
  const [workouts, weights, measurements] = await Promise.all([
    prisma.workout.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { date: "desc" },
      include: { _count: { select: { exercises: true } } },
      take: 30,
    }),
    prisma.bodyWeightLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.bodyMeasurement.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const latestWeight = weights[0];
  const prevWeight = weights[1];
  const delta = latestWeight && prevWeight ? latestWeight.weightKg - prevWeight.weightKg : null;

  return (
    <div>
      <PageHeader title="Exercise" description="Log workouts with exercises and sets, and track body metrics (kg / cm)." />

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ New workout</summary>
        <form action={createWorkout} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label">Workout name</label>
            <input name="name" className="input" placeholder="e.g. Push day" required />
          </div>
          <div>
            <label className="label">Date</label>
            <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
          </div>
          <div className="sm:col-span-3">
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <div className="sm:col-span-3">
            <button className="btn-primary">Create & add exercises</button>
          </div>
        </form>
      </details>

      <h2 className="section-title mb-3">Recent workouts</h2>
      <div className="space-y-2">
        {workouts.length === 0 && <p className="text-sm text-slate-400">No workouts logged yet.</p>}
        {workouts.map((w) => (
          <div key={w.id} className="card flex items-center gap-3 py-3">
            <Icon name="dumbbell" className="h-5 w-5 text-brand-500" />
            <Link href={`/dashboard/exercise/${w.id}`} className="flex-1">
              <p className="font-medium text-slate-800">{w.name}</p>
              <p className="text-xs text-slate-400">
                {formatDate(w.date)} · {w._count.exercises} exercises
              </p>
            </Link>
            <form action={deleteWorkout}>
              <input type="hidden" name="id" value={w.id} />
              <button className="text-slate-300 hover:text-red-500" title="Delete">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Body weight</h2>
            {latestWeight && (
              <span className="text-sm text-slate-500">
                {latestWeight.weightKg} kg
                {delta !== null && (
                  <span className={delta <= 0 ? "text-green-600" : "text-amber-600"}>
                    {" "}
                    ({delta > 0 ? "+" : ""}
                    {delta.toFixed(1)})
                  </span>
                )}
              </span>
            )}
          </div>
          <form action={logWeight} className="mt-3 flex items-end gap-2">
            <div>
              <label className="label">Weight (kg)</label>
              <input name="weightKg" type="number" step="any" className="input w-28" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <button className="btn-ghost">Log</button>
          </form>
          <div className="mt-4 space-y-1">
            {weights.map((w) => (
              <div key={w.id} className="flex justify-between text-sm text-slate-500">
                <span>{formatDate(w.date)}</span>
                <span className="font-medium text-slate-700">{w.weightKg} kg</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Body measurements</h2>
          <form action={logMeasurement} className="mt-3 flex items-end gap-2">
            <div>
              <label className="label">Label</label>
              <input name="label" className="input w-28" placeholder="waist" required />
            </div>
            <div>
              <label className="label">cm</label>
              <input name="valueCm" type="number" step="any" className="input w-24" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <button className="btn-ghost">Log</button>
          </form>
          <div className="mt-4 space-y-1">
            {measurements.map((m) => (
              <div key={m.id} className="flex justify-between text-sm text-slate-500">
                <span className="capitalize">
                  {m.label} <span className="text-slate-300">· {formatDate(m.date)}</span>
                </span>
                <span className="font-medium text-slate-700">{m.valueCm} cm</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
