"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import CollapsibleSection from "@/components/CollapsibleSection";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import SubmitButton from "@/components/SubmitButton";
import { formatProgramExerciseLabel } from "@/lib/exercise/format";
import { archiveProgram, restoreProgram } from "./programs/actions";
import { startWorkoutFromProgram } from "./actions";

export type ProgramListExercise = {
  id: string;
  name: string;
  plannedSets: number;
  plannedReps: number | null;
};

export type ProgramListItem = {
  id: string;
  name: string;
  notes: string | null;
  archivedAt: Date | string | null;
  exercises: ProgramListExercise[];
};

/** Primary "Start workout" control for a program (shared with the program page). */
export function StartWorkoutForm({
  programId,
  programName,
  todayValue,
  className,
}: {
  programId: string;
  programName: string;
  todayValue: string;
  className?: string;
}) {
  return (
    <ActionForm action={startWorkoutFromProgram} className={className}>
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="date" value={todayValue} />
      <SubmitButton
        className="btn-primary touch-target w-full sm:w-auto"
        aria-label={`Start workout: ${programName}`}
        pendingLabel="Starting…"
      >
        <Icon name="play" className="h-4 w-4" />
        Start workout
      </SubmitButton>
    </ActionForm>
  );
}

export default function ProgramsSection({
  programs,
  todayValue,
}: {
  programs: ProgramListItem[];
  todayValue: string;
}) {
  const [showArchived, setShowArchived] = useState(false);

  const active = programs.filter((p) => !p.archivedAt);
  const archived = programs.filter((p) => p.archivedAt);
  const visible = showArchived ? archived : active;

  useEffect(() => {
    if (showArchived && archived.length === 0) setShowArchived(false);
  }, [showArchived, archived.length]);

  return (
    <section className="mb-8" aria-labelledby="programs-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="programs-title" className="section-title mb-0">
          {showArchived ? "Archived programs" : "Programs"}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/exercise/programs/new" className="btn-ghost touch-target">
            <Icon name="plus" className="h-4 w-4" />
            New program
          </Link>
          <Link href="/dashboard/exercise/programs/new#paste" className="btn-ghost touch-target">
            Paste from text
          </Link>
        </div>
      </div>

      {programs.length === 0 && (
        <EmptyState
          icon="dumbbell"
          title="No workout programs yet"
          description="Save a reusable session like Full Body, then start it with one tap when you train."
          actionLabel="New program"
          actionHref="/dashboard/exercise/programs/new"
          tip="You can also paste a numbered list of exercises."
        />
      )}

      {visible.length === 0 && !showArchived && archived.length > 0 && (
        <EmptyState
          variant="inline"
          icon="dumbbell"
          headingLevel="h3"
          title="No active programs"
          description="Restore an archived program or create a new one."
        />
      )}

      {visible.length > 0 && (
        <ul className="space-y-3">
          {visible.map((program) => {
            const isArchived = Boolean(program.archivedAt);
            const count = program.exercises.length;
            return (
              <li key={program.id} className="card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                      <Link
                        href={`/dashboard/exercise/programs/${program.id}`}
                        className="hover:text-brand-700 hover:underline dark:hover:text-brand-300"
                      >
                        {program.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted">
                      {count === 1 ? "1 exercise" : `${count} exercises`}
                      {isArchived && " · Archived"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {!isArchived && count > 0 && (
                      <StartWorkoutForm
                        programId={program.id}
                        programName={program.name}
                        todayValue={todayValue}
                        className="col-span-2"
                      />
                    )}
                    <Link
                      href={`/dashboard/exercise/programs/${program.id}`}
                      className="btn-ghost touch-target w-full sm:w-auto"
                      aria-label={`Edit ${program.name}`}
                    >
                      <Icon name="pencil" className="h-4 w-4" />
                      Edit
                    </Link>
                    {isArchived ? (
                      <ActionForm action={restoreProgram} successMessage="Program restored">
                        <input type="hidden" name="id" value={program.id} />
                        <SubmitButton className="btn-ghost touch-target w-full sm:w-auto" aria-label={`Restore ${program.name}`}>
                          <Icon name="undo" className="h-4 w-4" />
                          Restore
                        </SubmitButton>
                      </ActionForm>
                    ) : (
                      <ActionForm
                        action={archiveProgram}
                        successMessage="Program archived"
                        confirm={{
                          title: `Archive “${program.name}”?`,
                          message: "It will be hidden from your active list. You can restore it later.",
                          confirmLabel: "Archive",
                        }}
                      >
                        <input type="hidden" name="id" value={program.id} />
                        <SubmitButton className="btn-ghost touch-target w-full sm:w-auto" aria-label={`Archive ${program.name}`}>
                          Archive
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </div>

                {count > 0 ? (
                  <CollapsibleSection title="Exercises" count={count} className="mt-2">
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                      {program.exercises.map((ex) => (
                        <li key={ex.id}>{formatProgramExerciseLabel(ex)}</li>
                      ))}
                    </ol>
                  </CollapsibleSection>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    No exercises yet.{" "}
                    <Link href={`/dashboard/exercise/programs/${program.id}`} className="link">
                      Add exercises
                    </Link>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && (
        <button
          type="button"
          className="btn-ghost touch-target mt-3"
          aria-pressed={showArchived}
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Show active programs" : `Show archived (${archived.length})`}
        </button>
      )}
    </section>
  );
}
