"use client";

import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import Icon from "@/components/Icon";
import {
  updateProgramExerciseForm,
  deleteProgramExercise,
  reorderProgramExercise,
} from "./actions";

type Props = {
  id: string;
  programId: string;
  name: string;
  plannedSets: number;
  plannedReps: number | null;
  isFirst: boolean;
  isLast: boolean;
};

export default function ProgramExerciseRow({
  id,
  programId,
  name,
  plannedSets,
  plannedReps,
  isFirst,
  isLast,
}: Props) {
  return (
    <div className="card">
      <FormAction action={updateProgramExerciseForm} successMessage="Exercise updated" className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="programId" value={programId} />
        <div className="sm:col-span-5">
          <label className="label" htmlFor={`ex-name-${id}`}>
            Exercise
          </label>
          <input id={`ex-name-${id}`} name="name" className="input" required defaultValue={name} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`ex-sets-${id}`}>
            Sets
          </label>
          <input
            id={`ex-sets-${id}`}
            name="plannedSets"
            type="number"
            min={1}
            className="input"
            required
            defaultValue={plannedSets}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`ex-reps-${id}`}>
            Reps
          </label>
          <input
            id={`ex-reps-${id}`}
            name="plannedReps"
            type="number"
            min={1}
            className="input"
            placeholder="opt."
            defaultValue={plannedReps ?? ""}
          />
        </div>
        <div className="sm:col-span-3">
          <SubmitButton className="btn-ghost touch-target w-full">Save</SubmitButton>
        </div>
      </FormAction>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={reorderProgramExercise}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="direction" value="up" />
          <SubmitIconButton
            className="touch-target text-slate-300 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
            title="Move up"
            disabled={isFirst}
            icon={<Icon name="chevronUp" className="h-4 w-4" />}
          />
        </form>
        <form action={reorderProgramExercise}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="direction" value="down" />
          <SubmitIconButton
            className="touch-target text-slate-300 hover:text-slate-600 disabled:opacity-40 dark:hover:text-slate-200"
            title="Move down"
            disabled={isLast}
            icon={<Icon name="chevronDown" className="h-4 w-4" />}
          />
        </form>
        <form action={deleteProgramExercise}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="programId" value={programId} />
          <SubmitIconButton
            className="touch-target text-slate-300 hover:text-red-500 dark:hover:text-red-400"
            title="Remove exercise"
            icon={<Icon name="trash" className="h-4 w-4" />}
          />
        </form>
      </div>
    </div>
  );
}
