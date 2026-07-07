"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PLAN_KIND_LABELS, type PlanKind } from "@/lib/plan/kinds";
import { parsePlanText, type ParsePlanTextResult } from "@/lib/plan/parse-text";
import { importPlanFromText } from "./actions";

const PLACEHOLDER = `02:55  Sabah alarm
02:59  Sabah namazı
07:30  Kalkış
08:20  Spor
10:00  İlk öğün`;

type Props = {
  dayValue: string;
};

export default function PlanTextImport({ dayValue }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [preview, setPreview] = useState<ParsePlanTextResult | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [pending, startTransition] = useTransition();

  function handlePreview() {
    setResult(null);
    setPreview(parsePlanText(text));
  }

  function handleImport() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("planDate", dayValue);
      fd.set("text", text);
      fd.set("mode", mode);
      const res = await importPlanFromText(fd);
      setResult({ imported: res.imported, skipped: res.skipped });
      setPreview(parsePlanText(text));
      router.refresh();
    });
  }

  return (
    <details className="card">
      <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-200">Import from text</summary>
      <p className="mt-2 text-xs text-slate-400">
        Paste one line per block: <code className="text-slate-500">HH:MM  Title</code>. End times are
        inferred from the next line.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
          setResult(null);
        }}
        className="input mt-3 min-h-[160px] w-full font-mono text-sm"
        placeholder={PLACEHOLDER}
        spellCheck={false}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={handlePreview} className="btn-ghost text-sm">
          Preview
        </button>
      </div>

      {preview && (
        <div className="mt-4">
          {preview.warnings.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-amber-700">
              {preview.warnings.map((w) => (
                <li key={w}>· {w}</li>
              ))}
            </ul>
          )}

          {preview.entries.length === 0 ? (
            <p className="text-sm text-slate-400">No valid blocks found in pasted text.</p>
          ) : (
            <>
              <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Kind</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.entries.map((entry) => (
                      <tr key={`${entry.lineNumber}-${entry.startTime}`} className="border-t border-slate-50">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                          {entry.startTime} – {entry.endTime}
                          {entry.crossesMidnight && (
                            <span className="ml-1 text-xs text-slate-400">+1d</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{entry.title}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {PLAN_KIND_LABELS[entry.kind as PlanKind] ?? entry.kind}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <fieldset className="flex flex-wrap gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      checked={mode === "replace"}
                      onChange={() => setMode("replace")}
                    />
                    Replace day
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      checked={mode === "merge"}
                      onChange={() => setMode("merge")}
                    />
                    Merge
                  </label>
                </fieldset>

                <button
                  type="button"
                  disabled={pending}
                  onClick={handleImport}
                  className="btn-primary text-sm"
                >
                  {pending ? "Importing…" : `Import ${preview.entries.length} blocks`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {result && (
        <p className="mt-3 text-sm text-green-700">
          Imported {result.imported} block{result.imported === 1 ? "" : "s"}
          {result.skipped > 0 && ` · ${result.skipped} skipped (overlap in merge mode)`}
        </p>
      )}
    </details>
  );
}
