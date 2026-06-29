import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import {
  createGymWorkout,
  createCardioWorkout,
  deleteWorkout,
  logWeight,
  logMeasurement,
} from "./actions";

const ACTIVITY_LABELS: Record<string, string> = {
  run: "Run",
  swim: "Swim",
  gym: "Gym",
  other: "Other",
};

function formatWorkoutSummary(w: {
  activityType: string;
  distanceM: number | null;
  durationMin: number | null;
  _count: { exercises: number };
}): string {
  const parts: string[] = [];
  if (w.distanceM) {
    parts.push(w.activityType === "run" ? `${(w.distanceM / 1000).toFixed(1)} km` : `${w.distanceM} m`);
  }
  if (w.durationMin) parts.push(`${w.durationMin} min`);
  if (w.activityType === "gym") parts.push(`${w._count.exercises} exercises`);
  return parts.join(" · ") || (ACTIVITY_LABELS[w.activityType] ?? w.activityType);
}

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
      <PageHeader title="Exercise" description="Log runs, swims, gym sessions, and body metrics." />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <details className="card" open>
          <summary className="cursor-pointer font-medium text-brand-700">Run</summary>
          <form action={createCardioWorkout} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="activityType" value="run" />
            <div>
              <label className="label">Distance (km)</label>
              <input name="distanceKm" type="number" step="any" className="input" placeholder="5" />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input name="durationMin" type="number" className="input" placeholder="28" />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" className="input" placeholder="optional" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary touch-target">Log run</button>
            </div>
          </form>
        </details>

        <details className="card">
          <summary className="cursor-pointer font-medium text-brand-700">Swim</summary>
          <form action={createCardioWorkout} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="activityType" value="swim" />
            <div>
              <label className="label">Distance (m)</label>
              <input name="distanceM" type="number" className="input" placeholder="1500" />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input name="durationMin" type="number" className="input" placeholder="35" />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" className="input" placeholder="optional" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary touch-target">Log swim</button>
            </div>
          </form>
        </details>

        <details className="card">
          <summary className="cursor-pointer font-medium text-brand-700">Gym session</summary>
          <form action={createGymWorkout} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Session name</label>
              <input name="name" className="input" placeholder="e.g. Push day" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" className="input" placeholder="optional" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary touch-target">Create & add exercises</button>
            </div>
          </form>
        </details>

        <details className="card">
          <summary className="cursor-pointer font-medium text-brand-700">Other</summary>
          <form action={createCardioWorkout} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="activityType" value="other" />
            <div className="sm:col-span-2">
              <label className="label">Activity</label>
              <input name="description" className="input" placeholder="e.g. Yoga" required />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input name="durationMin" type="number" className="input" placeholder="45" />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary touch-target">Log activity</button>
            </div>
          </form>
        </details>
      </div>

      <h2 className="section-title mb-3">Recent workouts</h2>
      <div className="space-y-2">
        {workouts.length === 0 && <p className="text-sm text-slate-400">No workouts logged yet.</p>}
        {workouts.map((w) => (
          <div key={w.id} className="card flex items-center gap-3 py-3">
            <Icon name="dumbbell" className="h-5 w-5 shrink-0 text-brand-500" />
            {w.activityType === "gym" ? (
              <Link href={`/dashboard/exercise/${w.id}`} className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{w.name}</p>
                <p className="text-xs text-slate-400">
                  {ACTIVITY_LABELS[w.activityType]} · {formatDate(w.date)} · {formatWorkoutSummary(w)}
                </p>
              </Link>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{w.name}</p>
                <p className="text-xs text-slate-400">
                  {ACTIVITY_LABELS[w.activityType]} · {formatDate(w.date)} · {formatWorkoutSummary(w)}
                </p>
              </div>
            )}
            <form action={deleteWorkout}>
              <input type="hidden" name="id" value={w.id} />
              <button type="submit" className="touch-target text-slate-300 hover:text-red-500" title="Delete">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
          <form action={logWeight} className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label className="label">Weight (kg)</label>
              <input name="weightKg" type="number" step="any" className="input w-28" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" defaultValue={toDateInputValue(now)} />
            </div>
            <button type="submit" className="btn-ghost touch-target">Log</button>
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
          <form action={logMeasurement} className="mt-3 flex flex-wrap items-end gap-2">
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
            <button type="submit" className="btn-ghost touch-target">Log</button>
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
