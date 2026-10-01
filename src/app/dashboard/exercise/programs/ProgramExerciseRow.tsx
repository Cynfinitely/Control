"use client";

import ActionForm from "@/components/ActionForm";
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
    <li className="card">
      <FormAction action={updateProgramExerciseForm} successMessage="Exercise updated" className="grid grid-cols-2 gap-3 sm:grid-cols-12 sm:items-end">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="programId" value={programId} />
        <div className="col-span-2 sm:col-span-5">
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
            inputMode="numeric"
            className="input"
            required
            defaultValue={plannedSets}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor={`ex-reps-${id}`}>
            Reps <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`ex-reps-${id}`}
            name="plannedReps"
            type="number"
            min={1}
            inputMode="numeric"
            className="input"
            defaultValue={plannedReps ?? ""}
          />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <SubmitButton className="btn-ghost touch-target w-full">Save</SubmitButton>
        </div>
      </FormAction>

      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2 dark:border-slate-700">
        <ActionForm action={reorderProgramExercise}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="direction" value="up" />
          <SubmitIconButton
            className="btn-icon"
            aria-label={`Move ${name} up`}
            disabled={isFirst}
            icon={<Icon name="chevronUp" className="h-4 w-4" />}
          />
        </ActionForm>
        <ActionForm action={reorderProgramExercise}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="programId" value={programId} />
          <input type="hidden" name="direction" value="down" />
          <SubmitIconButton
            className="btn-icon"
            aria-label={`Move ${name} down`}
            disabled={isLast}
            icon={<Icon name="chevronDown" className="h-4 w-4" />}
          />
        </ActionForm>
        <ActionForm
          action={deleteProgramExercise}
          className="ml-auto"
          confirm={{
            title: `Remove “${name}” from this program?`,
            message: "Workouts you already logged keep their exercises.",
            confirmLabel: "Remove",
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="programId" value={programId} />
          <SubmitIconButton
            className="btn-icon-danger"
            aria-label={`Remove ${name}`}
            icon={<Icon name="trash" className="h-4 w-4" />}
          />
        </ActionForm>
      </div>
    </li>
  );
}
