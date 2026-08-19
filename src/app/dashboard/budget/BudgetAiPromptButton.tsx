"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

type Props = {
  monthLabel: string;
  prompt: string;
  uncategorizedCount: number;
};

export default function BudgetAiPromptButton({ monthLabel, prompt, uncategorizedCount }: Props) {
  const { success } = useToast();
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    copyRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      success("Copied");
    } catch {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary touch-target">
        Copy AI prompt
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-ai-prompt-title"
            className="card relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col shadow-xl"
          >
            <h2 id="budget-ai-prompt-title" className="section-title">
              AI prompt for {monthLabel}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Paste this into ChatGPT or Cursor to analyze the month and suggest budget improvements.
            </p>
            {uncategorizedCount > 0 && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                {uncategorizedCount} transaction{uncategorizedCount === 1 ? "" : "s"} still
                uncategorized. Categorize them first for a more accurate analysis.
              </p>
            )}
            <textarea
              ref={textareaRef}
              readOnly
              value={prompt}
              className="input mt-3 min-h-[240px] flex-1 font-mono text-xs"
              spellCheck={false}
              aria-label="AI prompt"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                Close
              </button>
              <button ref={copyRef} type="button" onClick={copyPrompt} className="btn-primary">
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
