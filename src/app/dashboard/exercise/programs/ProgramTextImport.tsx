"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseProgramText, type ParseProgramTextResult } from "@/lib/exercise/parse-program-text";
import { formatProgramExerciseLabel } from "@/lib/exercise/format";
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
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParseProgramTextResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePreview() {
    setError(null);
    setPreview(parseProgramText(text));
  }

  function handleImport() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("text", text);
      const res = await importProgramFromText(fd);
      if (!res.ok) {
        setError(res.error);
        setPreview(parseProgramText(text));
        return;
      }
      router.push(`/dashboard/exercise/programs/${res.programId}`);
      router.refresh();
    });
  }

  return (
    <div id="paste" className="card">
      <h2 className="section-title">Paste from text</h2>
      <p className="mt-1 text-xs text-slate-400">
        First line is the program name. Then one exercise per line, e.g.{" "}
        <code className="text-slate-500 dark:text-slate-400">1. Bench Press — 3 sets</code> or{" "}
        <code className="text-slate-500 dark:text-slate-400">Bench Press 3x8</code>.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
          setError(null);
        }}
        className="input mt-3 min-h-[200px] w-full font-mono text-sm"
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={handlePreview} className="btn-ghost text-sm">
          Preview
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {preview && (
        <div className="mt-4">
          {preview.warnings.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-amber-700 dark:text-amber-400">
              {preview.warnings.map((w) => (
                <li key={w}>· {w}</li>
              ))}
            </ul>
          )}

          {preview.error || preview.exercises.length === 0 ? (
            <p className="text-sm text-slate-400">{preview.error ?? "No exercises found in pasted text."}</p>
          ) : (
            <>
              <p className="mb-2 font-medium text-slate-800 dark:text-slate-100">{preview.name}</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {preview.exercises.map((ex) => (
                  <li key={`${ex.lineNumber}-${ex.name}`}>{formatProgramExerciseLabel(ex)}</li>
                ))}
              </ol>
              <button
                type="button"
                disabled={pending}
                onClick={handleImport}
                className="btn-primary mt-4 text-sm"
              >
                {pending ? "Saving…" : `Save ${preview.exercises.length} exercises`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
