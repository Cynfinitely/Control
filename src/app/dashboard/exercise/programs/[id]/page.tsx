import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import { addProgramExerciseForm, updateProgramForm } from "../actions";
import ProgramExerciseRow from "../ProgramExerciseRow";
import ProgramStatusActions from "../ProgramStatusActions";

export default async function WorkoutProgramDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const program = await prisma.workoutProgram.findFirst({
    where: { id: params.id, userId: user.id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  if (!program) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Exercise", href: "/dashboard/exercise" },
          { label: program.name },
        ]}
      />
      <PageHeader
        title={program.name}
        description={program.archivedAt ? "Archived" : "Edit this program’s exercises and set counts."}
        action={<ProgramStatusActions id={program.id} archived={program.archivedAt !== null} />}
      />

      <FormAction action={updateProgramForm} successMessage="Program updated" className="card mb-6 grid grid-cols-1 gap-3">
        <input type="hidden" name="id" value={program.id} />
        <div>
          <label className="label" htmlFor="program-name">
            Name
          </label>
          <input id="program-name" name="name" className="input" required defaultValue={program.name} />
        </div>
        <div>
          <label className="label" htmlFor="program-notes">
            Notes (optional)
          </label>
          <input id="program-notes" name="notes" className="input" defaultValue={program.notes ?? ""} />
        </div>
        <SubmitButton className="btn-primary touch-target">Save program</SubmitButton>
      </FormAction>

      <h2 className="section-title mb-3">Exercises</h2>
      <div className="space-y-3">
        {program.exercises.length === 0 && (
          <p className="text-sm text-slate-400">No exercises yet. Add one below or paste a list from the new-program page.</p>
        )}
        {program.exercises.map((ex, index) => (
          <ProgramExerciseRow
            key={ex.id}
            id={ex.id}
            programId={program.id}
            name={ex.name}
            plannedSets={ex.plannedSets}
            plannedReps={ex.plannedReps}
            isFirst={index === 0}
            isLast={index === program.exercises.length - 1}
          />
        ))}
      </div>

      <div className="card mt-4">
        <FormAction
          action={addProgramExerciseForm}
          successMessage="Exercise added"
          resetOnSuccess
          className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end"
        >
          <input type="hidden" name="programId" value={program.id} />
          <div className="sm:col-span-5">
            <label className="label" htmlFor="add-ex-name">
              Add exercise
            </label>
            <input id="add-ex-name" name="name" className="input" placeholder="e.g. Bench press" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="add-ex-sets">
              Sets
            </label>
            <input id="add-ex-sets" name="plannedSets" type="number" min={1} className="input" defaultValue={3} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="add-ex-reps">
              Reps
            </label>
            <input id="add-ex-reps" name="plannedReps" type="number" min={1} className="input" placeholder="opt." />
          </div>
          <div className="sm:col-span-3">
            <SubmitButton className="btn-primary touch-target w-full">Add</SubmitButton>
          </div>
        </FormAction>
      </div>
    </div>
  );
}
