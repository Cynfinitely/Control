import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/date";
import {
  activityLabel,
  formatDistance,
  formatPace,
  formatPlan,
  nextSetPrefill,
  setProgress,
} from "@/lib/exercise/session";
import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import ActionForm from "@/components/ActionForm";
import EmptyState from "@/components/EmptyState";
import FormField from "@/components/FormField";
import Icon from "@/components/Icon";
import StatCard from "@/components/StatCard";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { addExercise, deleteExercise, addSet, deleteSet } from "../actions";
import DeleteWorkoutButton from "./DeleteWorkoutButton";

export const metadata = { title: "Workout" };

export default async function WorkoutDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const workout = await prisma.workout.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: {
      program: { select: { id: true, name: true } },
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!workout) notFound();

  const isGym = workout.activityType === "gym";
  const pace =
    workout.activityType === "run" || workout.activityType === "walk"
      ? formatPace(workout.distanceM, workout.durationMin)
      : null;

  return (
    <div>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Exercise", href: "/dashboard/exercise" },
              { label: workout.name },
            ]}
          />
        }
        title={workout.name}
        description={
          <>
            {activityLabel(workout.activityType)} · {formatDate(workout.date)}
            {workout.program && (
              <>
                {" · From "}
                <Link href={`/dashboard/exercise/programs/${workout.program.id}`} className="link">
                  {workout.program.name}
                </Link>
              </>
            )}
          </>
        }
        action={<DeleteWorkoutButton id={workout.id} name={workout.name} isGym={isGym} />}
      />

      {workout.notes && <p className="mb-6 text-sm text-muted">{workout.notes}</p>}

      {!isGym && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Distance"
            value={workout.distanceM ? formatDistance(workout.activityType, workout.distanceM) : "—"}
          />
          <StatCard label="Duration" value={workout.durationMin ? `${workout.durationMin} min` : "—"} />
          {pace ? (
            <StatCard label="Average pace" value={pace} />
          ) : workout.walkKind ? (
            <StatCard label="Type" value={workout.walkKind === "indoor" ? "Indoor" : "Outdoor"} />
          ) : null}
        </div>
      )}

      {isGym && (
        <>
          {workout.exercises.length === 0 && (
            <EmptyState
              icon="dumbbell"
              title="No exercises yet"
              description="Add your first exercise below, then log each set as you go."
            />
          )}

          <div className="space-y-4">
            {workout.exercises.map((ex) => {
              const plan = formatPlan(ex.plannedSets, ex.plannedReps);
              const progress = setProgress(ex.sets.length, ex.plannedSets);
              const prefill = nextSetPrefill(ex.sets, ex.plannedReps);
              return (
                <section key={ex.id} className="card" aria-labelledby={`ex-title-${ex.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2
                        id={`ex-title-${ex.id}`}
                        className="break-words font-semibold text-slate-800 dark:text-slate-100"
                      >
                        {ex.name}
                      </h2>
                      {(plan || progress) && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                          {plan && <span>Planned {plan}</span>}
                          {progress && (
                            <span className={progress.complete ? "badge-success" : "badge-muted"}>
                              {progress.complete && <Icon name="check" className="h-3.5 w-3.5" />}
                              {progress.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ActionForm
                      action={deleteExercise}
                      confirm={{
                        title: `Remove “${ex.name}”?`,
                        message:
                          ex.sets.length > 0
                            ? `Its ${ex.sets.length === 1 ? "set" : `${ex.sets.length} sets`} will be deleted too.`
                            : "This can't be undone.",
                        confirmLabel: "Remove",
                      }}
                    >
                      <input type="hidden" name="id" value={ex.id} />
                      <input type="hidden" name="workoutId" value={workout.id} />
                      <SubmitIconButton
                        className="btn-icon-danger"
                        aria-label={`Remove ${ex.name}`}
                        icon={<Icon name="trash" className="h-4 w-4" />}
                      />
                    </ActionForm>
                  </div>

                  {ex.sets.length > 0 && (
                    <div className="table-wrap mt-3">
                      <table className="w-full min-w-[20rem] text-sm">
                        <caption className="sr-only">Sets for {ex.name}</caption>
                        <thead>
                          <tr className="text-left text-xs text-muted">
                            <th scope="col" className="pb-1 font-medium">Set</th>
                            <th scope="col" className="pb-1 font-medium">Reps</th>
                            <th scope="col" className="pb-1 font-medium">Weight (kg)</th>
                            <th scope="col" className="pb-1 font-medium">Time (s)</th>
                            <th scope="col" className="pb-1">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ex.sets.map((s, i) => (
                            <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700">
                              <td className="py-0.5 text-muted">{i + 1}</td>
                              <td className="py-0.5 tabular-nums">{s.reps ?? "—"}</td>
                              <td className="py-0.5 tabular-nums">{s.weightKg ?? "—"}</td>
                              <td className="py-0.5 tabular-nums">{s.durationSec ?? "—"}</td>
                              <td className="py-0.5 text-right">
                                <ActionForm
                                  action={deleteSet}
                                  className="inline-block"
                                  confirm={{ title: `Delete set ${i + 1} of ${ex.name}?` }}
                                >
                                  <input type="hidden" name="id" value={s.id} />
                                  <input type="hidden" name="workoutId" value={workout.id} />
                                  <SubmitIconButton
                                    className="btn-icon-danger"
                                    aria-label={`Delete set ${i + 1} of ${ex.name}`}
                                    icon={<Icon name="trash" className="h-4 w-4" />}
                                  />
                                </ActionForm>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <ActionForm
                    key={ex.sets.length}
                    action={addSet}
                    className={clsx(
                      "mt-3 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-end",
                      ex.sets.length > 0 && "border-t border-slate-100 pt-3 dark:border-slate-700"
                    )}
                  >
                    <input type="hidden" name="workoutExerciseId" value={ex.id} />
                    <input type="hidden" name="workoutId" value={workout.id} />
                    <FormField label="Reps">
                      {(_id, aria) => (
                        <input
                          {...aria}
                          name="reps"
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="input sm:w-20"
                          defaultValue={prefill.reps}
                        />
                      )}
                    </FormField>
                    <FormField label="Weight (kg)">
                      {(_id, aria) => (
                        <input
                          {...aria}
                          name="weightKg"
                          type="number"
                          step="any"
                          min={0}
                          inputMode="decimal"
                          className="input sm:w-24"
                          defaultValue={prefill.weightKg}
                        />
                      )}
                    </FormField>
                    <FormField label="Time (s)">
                      {(_id, aria) => (
                        <input
                          {...aria}
                          name="durationSec"
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="input sm:w-24"
                          defaultValue={prefill.durationSec}
                        />
                      )}
                    </FormField>
                    <SubmitButton
                      className="btn-ghost touch-target col-span-3 sm:col-span-1"
                      aria-label={`Add set ${ex.sets.length + 1} to ${ex.name}`}
                    >
                      <Icon name="plus" className="h-4 w-4" />
                      Add set {ex.sets.length + 1}
                    </SubmitButton>
                  </ActionForm>
                </section>
              );
            })}
          </div>

          <div className="card mt-4">
            <ActionForm
              action={addExercise}
              successMessage="Exercise added"
              resetOnSuccess
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="workoutId" value={workout.id} />
              <FormField label="Add exercise" className="min-w-0 flex-1">
                {(_id, aria) => <input {...aria} name="name" className="input" placeholder="e.g. Bench press" required />}
              </FormField>
              <SubmitButton className="btn-primary touch-target">Add</SubmitButton>
            </ActionForm>
          </div>
        </>
      )}
    </div>
  );
}
