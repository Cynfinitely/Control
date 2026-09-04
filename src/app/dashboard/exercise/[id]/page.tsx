import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import { addExercise, deleteExercise, addSet, deleteSet } from "../actions";

export default async function WorkoutDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const workout = await prisma.workout.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!workout) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Exercise", href: "/dashboard/exercise" },
          { label: workout.name },
        ]}
      />
      <PageHeader
        title={workout.name}
        description={formatDate(workout.date)}
      />

      {workout.notes && <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{workout.notes}</p>}

      <div className="space-y-4">
        {workout.exercises.map((ex) => (
          <div key={ex.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 break-words font-semibold text-slate-800 dark:text-slate-100">{ex.name}</h3>
              <form action={deleteExercise}>
                <input type="hidden" name="id" value={ex.id} />
                <input type="hidden" name="workoutId" value={workout.id} />
                <SubmitIconButton
                  className="text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                  title="Remove exercise"
                  icon={<Icon name="trash" className="h-4 w-4" />}
                />
              </form>
            </div>

            <div className="table-wrap mt-3">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="pb-1">Set</th>
                  <th className="pb-1">Reps</th>
                  <th className="pb-1">Weight (kg)</th>
                  <th className="pb-1">Duration (s)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((s, i) => (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="py-1 text-slate-400">{i + 1}</td>
                    <td className="py-1">{s.reps ?? "-"}</td>
                    <td className="py-1">{s.weightKg ?? "-"}</td>
                    <td className="py-1">{s.durationSec ?? "-"}</td>
                    <td className="py-1 text-right">
                      <form action={deleteSet}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="workoutId" value={workout.id} />
                        <SubmitIconButton
                          className="text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                          icon={<Icon name="trash" className="h-3 w-3" />}
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <form action={addSet} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <input type="hidden" name="workoutExerciseId" value={ex.id} />
              <input type="hidden" name="workoutId" value={workout.id} />
              <input name="reps" type="number" className="input sm:w-20" placeholder="reps" />
              <input name="weightKg" type="number" step="any" className="input sm:w-24" placeholder="kg" />
              <input name="durationSec" type="number" className="input sm:w-24" placeholder="sec" />
              <SubmitButton className="btn-ghost touch-target">+ Set</SubmitButton>
            </form>
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <form action={addExercise} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="workoutId" value={workout.id} />
          <div className="min-w-0 flex-1">
            <label className="label">Add exercise</label>
            <input name="name" className="input" placeholder="e.g. Bench press" required />
          </div>
          <SubmitButton className="btn-primary touch-target">Add</SubmitButton>
        </form>
      </div>
    </div>
  );
}
