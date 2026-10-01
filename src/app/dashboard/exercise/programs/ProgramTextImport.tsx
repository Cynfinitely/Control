"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseProgramText } from "@/lib/exercise/parse-program-text";
import { formatProgramExerciseLabel } from "@/lib/exercise/format";
import { useToast } from "@/components/Toast";
import Spinner from "@/components/Spinner";
import { importProgramFromText } from "./actions";

const PLACEHOLDER = `FULL BODY WORKOUT PROGRAM

1. Bench Press — 3 sets
2. Dumbbell Pullover — 3 sets
3. Reverse Grip Lat Pulldown — 3 sets
4. Seated Cable Row — 3 sets
5. Standing Military Press — 3 sets
6. Barbell Curl — 3 sets
7. Overhead Dumbbell Triceps Extension — 3 sets
8. Squat — 3 sets`;

export default function ProgramTextImport() {
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Live preview: parsing is cheap, so re-parse on every edit.
  const preview = useMemo(() => (text.trim() ? parseProgramText(text) : null), [text]);
  const canSave = Boolean(preview && !preview.error && preview.exercises.length > 0);

  function handleImport() {
    if (!canSave) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("text", text);
      try {
        const res = await importProgramFromText(fd);
        if (!res.ok) {
          setError(res.error);
          toast.error(res.error);
          return;
        }
        toast.success("Program saved");
        router.push(`/dashboard/exercise/programs/${res.programId}`);
        router.refresh();
      } catch {
        const message = "Couldn't save the program. Please try again.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <section id="paste" className="card scroll-mt-6" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-title">
        Paste from text
      </h2>
      <label htmlFor={`${id}-text`} className="label mt-3">
        Program text
      </label>
      <textarea
        id={`${id}-text`}
        aria-describedby={`${id}-hint`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        className="input min-h-[200px] w-full font-mono text-sm"
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />
      <p id={`${id}-hint`} className="hint">
        First line is the program name. Then one exercise per line, e.g.{" "}
        <code>1. Bench Press — 3 sets</code> or <code>Bench Press 3x8</code>. The preview updates as you type.
      </p>

      {error && (
        <p className="field-error mt-3" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4" aria-live="polite">
        {preview && (
          <>
            {preview.warnings.length > 0 && (
              <ul className="mb-3 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                {preview.warnings.map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
            )}

            {!canSave ? (
              <p className="text-sm text-muted">{preview.error ?? "No exercises found yet. Add one per line."}</p>
            ) : (
              <div className="tile">
                <p className="eyebrow">Preview</p>
                <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{preview.name}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {preview.exercises.map((ex) => (
                    <li key={`${ex.lineNumber}-${ex.name}`}>{formatProgramExerciseLabel(ex)}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>

      {canSave && preview && (
        <button
          type="button"
          disabled={pending}
          onClick={handleImport}
          className="btn-primary touch-target mt-4 w-full sm:w-auto"
        >
          {pending && <Spinner />}
          {pending
            ? "Saving…"
            : `Save program (${preview.exercises.length} ${preview.exercises.length === 1 ? "exercise" : "exercises"})`}
        </button>
      )}
    </section>
  );
}
