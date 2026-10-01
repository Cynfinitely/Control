"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CollapsibleSection from "@/components/CollapsibleSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { PLAN_KIND_LABELS, type PlanKind } from "@/lib/plan/kinds";
import { parsePlanText, type ParsePlanTextResult } from "@/lib/plan/parse-text";
import { importPlanFromText } from "./actions";

const PLACEHOLDER = `02:55  Sabah alarm
02:59  Sabah namazı
07:30  Kalkış
08:20  Spor
10:00  İlk öğün`;

type Mode = "merge" | "replace";

type Props = {
  dayValue: string;
  /** Blocks already on the day — used in the replace confirmation. */
  blockCount: number;
};

export default function PlanTextImport({ dayValue, blockCount }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("merge");
  const [preview, setPreview] = useState<ParsePlanTextResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handlePreview() {
    setPreview(parsePlanText(text));
  }

  function runImport() {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("planDate", dayValue);
        fd.set("text", text);
        fd.set("mode", mode);
        const res = await importPlanFromText(fd);
        if (res.imported === 0) {
          toast.error(
            res.skipped > 0
              ? `Nothing imported — all ${res.skipped} blocks overlap existing ones.`
              : "Nothing imported — no valid lines found."
          );
          return;
        }
        toast.success(
          `Imported ${res.imported} block${res.imported === 1 ? "" : "s"}` +
            (res.skipped > 0 ? ` · ${res.skipped} skipped (overlap)` : "")
        );
        setText("");
        setPreview(null);
        router.refresh();
      } catch {
        toast.error("Import failed. Check your connection and try again.");
      }
    });
  }

  function handleImport() {
    if (mode === "replace" && blockCount > 0) {
      setConfirmOpen(true);
      return;
    }
    runImport();
  }

  return (
    <CollapsibleSection title="Import from text" variant="card" icon="upload" as="h2">
      <p className="hint mt-0">
        Paste one line per block: <code className="font-mono">HH:MM  Title</code>. End times are inferred from the next
        line.
      </p>

      <label htmlFor="plan-import-text" className="label mt-3">
        Schedule text
      </label>
      <textarea
        id="plan-import-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
        className="input min-h-[160px] w-full font-mono text-sm"
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={handlePreview} className="btn-ghost" disabled={!text.trim()}>
          Preview
        </button>
      </div>

      {preview && (
        <div className="mt-4">
          {preview.warnings.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-amber-800 dark:text-amber-300">
              {preview.warnings.map((w) => (
                <li key={w}>· {w}</li>
              ))}
            </ul>
          )}

          {preview.entries.length === 0 ? (
            <p className="text-sm text-muted">No valid blocks found. Each line should start with a time like 07:30.</p>
          ) : (
            <>
              <div className="table-wrap max-h-64 overflow-auto rounded-lg border border-slate-100 dark:border-slate-700">
                <table className="w-full min-w-[22rem] text-left text-sm">
                  <caption className="sr-only">Blocks to import</caption>
                  <thead className="sticky top-0 bg-slate-50 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-3 py-2">Time</th>
                      <th scope="col" className="px-3 py-2">Title</th>
                      <th scope="col" className="px-3 py-2">Kind</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.entries.map((entry) => (
                      <tr key={`${entry.lineNumber}-${entry.startTime}`} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">
                          {entry.startTime} – {entry.endTime}
                          {entry.crossesMidnight && <span className="ml-1 text-xs text-muted">+1 day</span>}
                        </td>
                        <td className="px-3 py-2">{entry.title}</td>
                        <td className="px-3 py-2 text-muted">
                          {PLAN_KIND_LABELS[entry.kind as PlanKind] ?? entry.kind}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <fieldset className="mt-4">
                <legend className="label">How to import</legend>
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-4">
                  <label className="flex min-h-[40px] items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      checked={mode === "merge"}
                      onChange={() => setMode("merge")}
                    />
                    Add to the day (skip overlaps)
                  </label>
                  <label className="flex min-h-[40px] items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      checked={mode === "replace"}
                      onChange={() => setMode("replace")}
                    />
                    Replace the whole day
                  </label>
                </div>
              </fieldset>

              <button
                type="button"
                disabled={pending}
                onClick={handleImport}
                className={mode === "replace" && blockCount > 0 ? "btn-danger mt-3" : "btn-primary mt-3"}
              >
                {pending && <Spinner />}
                {pending
                  ? "Importing…"
                  : `${mode === "replace" ? "Replace with" : "Import"} ${preview.entries.length} block${preview.entries.length === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Replace this day's plan?"
        message={`The ${blockCount} block${blockCount === 1 ? "" : "s"} already planned for this day will be removed and replaced by the imported ones.`}
        confirmLabel="Replace day"
        variant="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          runImport();
        }}
      />
    </CollapsibleSection>
  );
}
