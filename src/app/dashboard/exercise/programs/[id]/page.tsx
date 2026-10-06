import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireModule } from "@/lib/session";
import { toDateInputValue } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Breadcrumb from "@/components/Breadcrumb";
import EmptyState from "@/components/EmptyState";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import { addProgramExerciseForm, updateProgramForm } from "../actions";
import ProgramExerciseRow from "../ProgramExerciseRow";
import ProgramStatusActions from "../ProgramStatusActions";
import { StartWorkoutForm } from "../../ProgramsSection";

export const metadata = { title: "Program" };

export default async function WorkoutProgramDetail({ params }: { params: { id: string } }) {
  const user = await requireModule("exercise");
  const program = await prisma.workoutProgram.findFirst({
    where: { id: params.id, userId: user.id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  if (!program) notFound();

  const archived = program.archivedAt !== null;
  const canStart = !archived && program.exercises.length > 0;

  return (
    <div>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Exercise", href: "/dashboard/exercise" },
              { label: program.name },
            ]}
          />
        }
        title={program.name}
        description={
          archived
            ? "Archived. Restore it to start workouts from it again."
            : "Edit this program’s exercises and set counts, or start a workout from it."
        }
        action={
          <>
            {canStart && (
              <StartWorkoutForm
                programId={program.id}
                programName={program.name}
                todayValue={toDateInputValue(new Date())}
              />
            )}
            <ProgramStatusActions id={program.id} name={program.name} archived={archived} />
          </>
        }
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
            Notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="program-notes" name="notes" className="input" defaultValue={program.notes ?? ""} />
        </div>
        <div>
          <SubmitButton className="btn-primary touch-target w-full sm:w-auto">Save program</SubmitButton>
        </div>
      </FormAction>

      <h2 className="section-title mb-3">Exercises</h2>
      {program.exercises.length === 0 ? (
        <EmptyState
          variant="inline"
          icon="dumbbell"
          headingLevel="h3"
          title="No exercises yet"
          description="Add one below, or paste a list from the new-program page."
          actionLabel="Paste from text"
          actionHref="/dashboard/exercise/programs/new#paste"
        />
      ) : (
        <ol className="space-y-3">
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
        </ol>
      )}

      <div className="card mt-4">
        <FormAction
          action={addProgramExerciseForm}
          successMessage="Exercise added"
          resetOnSuccess
          className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:items-end"
        >
          <input type="hidden" name="programId" value={program.id} />
          <div className="col-span-2 sm:col-span-5">
            <label className="label" htmlFor="add-ex-name">
              Add exercise
            </label>
            <input id="add-ex-name" name="name" className="input" placeholder="e.g. Bench press" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="add-ex-sets">
              Sets
            </label>
            <input id="add-ex-sets" name="plannedSets" type="number" min={1} inputMode="numeric" className="input" defaultValue={3} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="add-ex-reps">
              Reps <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="add-ex-reps" name="plannedReps" type="number" min={1} inputMode="numeric" className="input" />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <SubmitButton className="btn-primary touch-target w-full">Add</SubmitButton>
          </div>
        </FormAction>
      </div>
    </div>
  );
}
