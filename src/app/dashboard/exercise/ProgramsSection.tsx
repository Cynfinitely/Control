"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { formatProgramExerciseLabel } from "@/lib/exercise/format";
import { archiveProgram, restoreProgram } from "./programs/actions";

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

export default function ProgramsSection({ programs }: { programs: ProgramListItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showArchived, setShowArchived] = useState(false);

  const active = programs.filter((p) => !p.archivedAt);
  const archived = programs.filter((p) => p.archivedAt);
  const visible = showArchived ? archived : active;

  useEffect(() => {
    if (showArchived && archived.length === 0) setShowArchived(false);
  }, [showArchived, archived.length]);

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title mb-0">Programs</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/exercise/programs/new" className="btn-ghost text-sm">
            New program
          </Link>
          <Link href="/dashboard/exercise/programs/new#paste" className="btn-ghost text-sm">
            Paste from text
          </Link>
        </div>
      </div>

      {visible.length === 0 && !showArchived && archived.length === 0 && (
        <EmptyState
          icon="dumbbell"
          title="No workout programs yet"
          description="Save a reusable session like Full Body, then open it when you train."
          actionLabel="New program"
          actionHref="/dashboard/exercise/programs/new"
          tip="You can also paste a numbered list of exercises."
        />
      )}

      {visible.length === 0 && !showArchived && archived.length > 0 && (
        <p className="text-sm text-slate-400">No active programs.</p>
      )}

      {visible.length === 0 && showArchived && (
        <p className="text-sm text-slate-400">No archived programs.</p>
      )}

      <div className="space-y-2">
        {visible.map((program) => (
          <details key={program.id} className="card">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-100">{program.name}</p>
                <p className="text-xs text-slate-400">
                  {program.exercises.length === 1 ? "1 exercise" : `${program.exercises.length} exercises`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/dashboard/exercise/programs/${program.id}`}
                  className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                >
                  Edit
                </Link>
                {program.archivedAt ? (
                  <button
                    type="button"
                    className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                    onClick={() => {
                      startTransition(async () => {
                        const fd = new FormData();
                        fd.set("id", program.id);
                        await restoreProgram(fd);
                        router.refresh();
                      });
                    }}
                  >
                    Restore
                  </button>
                ) : (
                  <DeleteConfirmButton
                    title="Archive program?"
                    message="This program will be hidden from your active list. You can restore it later."
                    label="Archive"
                    confirmLabel="Archive"
                    className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    onConfirm={() => {
                      startTransition(async () => {
                        const fd = new FormData();
                        fd.set("id", program.id);
                        await archiveProgram(fd);
                        router.refresh();
                      });
                    }}
                  />
                )}
              </div>
            </summary>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {program.exercises.map((ex) => (
                <li key={ex.id}>{formatProgramExerciseLabel(ex)}</li>
              ))}
            </ol>
            {program.exercises.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">No exercises yet.</p>
            )}
          </details>
        ))}
      </div>

      {archived.length > 0 && (
        <button
          type="button"
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Show active programs" : `Show archived (${archived.length})`}
        </button>
      )}
    </section>
  );
}
