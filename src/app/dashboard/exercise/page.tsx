import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDate } from "@/lib/date";
import { activityLabel, formatWorkoutSummary } from "@/lib/exercise/session";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import ActionForm from "@/components/ActionForm";
import EmptyState from "@/components/EmptyState";
import FocusTarget from "@/components/FocusTarget";
import FormField from "@/components/FormField";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { deleteWorkout, logWeight, logMeasurement, deleteWeight, deleteMeasurement } from "./actions";
import ProgramsSection from "./ProgramsSection";
import LogActivityCard from "./LogActivityCard";

export const metadata = { title: "Exercise" };

const ACTIVITY_ICONS: Record<string, string> = {
  gym: "dumbbell",
  run: "heart",
  walk: "heart",
  swim: "heart",
  other: "sparkles",
};

export default async function ExercisePage() {
  const user = await requireUser();
  const now = new Date();
  const todayValue = toDateInputValue(now);
  const [workouts, weights, measurements, programs] = await Promise.all([
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
    prisma.workoutProgram.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { exercises: { orderBy: { order: "asc" } } },
    }),
  ]);

  const latestWeight = weights[0];
  const prevWeight = weights[1];
  const delta = latestWeight && prevWeight ? latestWeight.weightKg - prevWeight.weightKg : null;

  return (
    <div>
      <PageHeader title="Exercise" description="Log runs, walks, swims, gym sessions, and body metrics." />

      <ProgramsSection programs={programs} todayValue={todayValue} />

      <div className="mb-8">
        <FocusTarget value="log">
          <LogActivityCard todayValue={todayValue} />
        </FocusTarget>
      </div>

      <section aria-labelledby="recent-workouts-title" className="mb-8">
        <h2 id="recent-workouts-title" className="section-title mb-3">
          Recent workouts
        </h2>
        {workouts.length === 0 ? (
          <EmptyState
            icon="dumbbell"
            title="No workouts logged yet"
            description="Log a run, walk, swim or gym session above and it will show up here."
          />
        ) : (
          <ul className="card-flush divide-y divide-slate-100 dark:divide-slate-700">
            {workouts.map((w) => {
              const summary = formatWorkoutSummary({ ...w, exerciseCount: w._count.exercises });
              return (
                <li key={w.id} className="flex items-center gap-3 px-4 py-2 sm:px-5">
                  <Icon
                    name={ACTIVITY_ICONS[w.activityType] ?? "dumbbell"}
                    className="h-5 w-5 shrink-0 text-brand-500 dark:text-brand-400"
                  />
                  <Link
                    href={`/dashboard/exercise/${w.id}`}
                    className="group min-w-0 flex-1 rounded-md py-1.5"
                  >
                    <p className="truncate font-medium text-slate-800 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                      {w.name}
                    </p>
                    <p className="text-xs text-muted">
                      {activityLabel(w.activityType)} · {formatDate(w.date)} · {summary}
                    </p>
                  </Link>
                  <ActionForm
                    action={deleteWorkout}
                    confirm={{
                      title: `Delete “${w.name}”?`,
                      message:
                        w.activityType === "gym"
                          ? "The session and all its exercises and sets will be removed."
                          : "This workout will be removed from your log.",
                    }}
                  >
                    <input type="hidden" name="id" value={w.id} />
                    <SubmitIconButton
                      className="btn-icon-danger"
                      aria-label={`Delete ${w.name}`}
                      icon={<Icon name="trash" className="h-4 w-4" />}
                    />
                  </ActionForm>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card" aria-labelledby="body-weight-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="body-weight-title" className="section-title">
              Body weight
            </h2>
            {latestWeight && (
              <span className="text-sm text-muted">
                Latest {latestWeight.weightKg} kg
                {delta !== null && (
                  <span className={delta <= 0 ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}>
                    {" "}
                    ({delta > 0 ? "+" : ""}
                    {delta.toFixed(1)})
                  </span>
                )}
              </span>
            )}
          </div>
          <ActionForm
            action={logWeight}
            successMessage="Weight logged"
            resetOnSuccess
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <FormField label="Weight (kg)" className="min-w-0 flex-1 sm:flex-none">
              {(_id, aria) => (
                <input {...aria} name="weightKg" type="number" step="any" min={0} inputMode="decimal" className="input sm:w-28" required />
              )}
            </FormField>
            <FormField label="Date">
              {(_id, aria) => <input {...aria} name="date" type="date" className="input" defaultValue={todayValue} />}
            </FormField>
            <SubmitButton className="btn-ghost touch-target">Log</SubmitButton>
          </ActionForm>
          {weights.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No weigh-ins yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
              {weights.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 text-sm text-muted">
                  <span>{formatDate(w.date)}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-100">{w.weightKg} kg</span>
                    <ActionForm
                      action={deleteWeight}
                      confirm={{ title: `Delete ${w.weightKg} kg from ${formatDate(w.date)}?` }}
                    >
                      <input type="hidden" name="id" value={w.id} />
                      <SubmitIconButton
                        className="btn-icon-danger"
                        aria-label={`Delete weight entry ${w.weightKg} kg, ${formatDate(w.date)}`}
                        icon={<Icon name="trash" className="h-4 w-4" />}
                      />
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="body-measurements-title">
          <h2 id="body-measurements-title" className="section-title">
            Body measurements
          </h2>
          <ActionForm
            action={logMeasurement}
            successMessage="Measurement logged"
            resetOnSuccess
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <FormField label="Measurement" className="min-w-0 flex-1 sm:flex-none">
              {(_id, aria) => <input {...aria} name="label" className="input sm:w-28" placeholder="waist" required />}
            </FormField>
            <FormField label="cm">
              {(_id, aria) => (
                <input {...aria} name="valueCm" type="number" step="any" min={0} inputMode="decimal" className="input sm:w-24" required />
              )}
            </FormField>
            <FormField label="Date">
              {(_id, aria) => <input {...aria} name="date" type="date" className="input" defaultValue={todayValue} />}
            </FormField>
            <SubmitButton className="btn-ghost touch-target">Log</SubmitButton>
          </ActionForm>
          {measurements.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No measurements yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
              {measurements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm text-muted">
                  <span className="min-w-0">
                    <span className="capitalize">{m.label}</span> · {formatDate(m.date)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-700 dark:text-slate-100">{m.valueCm} cm</span>
                    <ActionForm
                      action={deleteMeasurement}
                      confirm={{ title: `Delete ${m.label} ${m.valueCm} cm from ${formatDate(m.date)}?` }}
                    >
                      <input type="hidden" name="id" value={m.id} />
                      <SubmitIconButton
                        className="btn-icon-danger"
                        aria-label={`Delete ${m.label} measurement, ${formatDate(m.date)}`}
                        icon={<Icon name="trash" className="h-4 w-4" />}
                      />
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
