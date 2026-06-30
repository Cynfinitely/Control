import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader
        title={workout.name}
        description={formatDate(workout.date)}
        action={
          <Link href="/dashboard/exercise" className="btn-ghost">
            ← All workouts
          </Link>
        }
      />

      {workout.notes && <p className="mb-6 text-sm text-slate-500">{workout.notes}</p>}

      <div className="space-y-4">
        {workout.exercises.map((ex) => (
          <div key={ex.id} className="card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{ex.name}</h3>
              <form action={deleteExercise}>
                <input type="hidden" name="id" value={ex.id} />
                <input type="hidden" name="workoutId" value={workout.id} />
                <SubmitIconButton
                  className="text-slate-300 hover:text-red-500"
                  title="Remove exercise"
                  icon={<Icon name="trash" className="h-4 w-4" />}
                />
              </form>
            </div>

            <table className="mt-3 w-full text-sm">
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
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-1 text-slate-400">{i + 1}</td>
                    <td className="py-1">{s.reps ?? "-"}</td>
                    <td className="py-1">{s.weightKg ?? "-"}</td>
                    <td className="py-1">{s.durationSec ?? "-"}</td>
                    <td className="py-1 text-right">
                      <form action={deleteSet}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="workoutId" value={workout.id} />
                        <SubmitIconButton
                          className="text-slate-300 hover:text-red-500"
                          icon={<Icon name="trash" className="h-3 w-3" />}
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <form action={addSet} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="workoutExerciseId" value={ex.id} />
              <input type="hidden" name="workoutId" value={workout.id} />
              <input name="reps" type="number" className="input w-20" placeholder="reps" />
              <input name="weightKg" type="number" step="any" className="input w-24" placeholder="kg" />
              <input name="durationSec" type="number" className="input w-24" placeholder="sec" />
              <SubmitButton className="btn-ghost">+ Set</SubmitButton>
            </form>
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <form action={addExercise} className="flex items-end gap-2">
          <input type="hidden" name="workoutId" value={workout.id} />
          <div className="flex-1">
            <label className="label">Add exercise</label>
            <input name="name" className="input" placeholder="e.g. Bench press" required />
          </div>
          <SubmitButton className="btn-primary">Add</SubmitButton>
        </form>
      </div>
    </div>
  );
}
