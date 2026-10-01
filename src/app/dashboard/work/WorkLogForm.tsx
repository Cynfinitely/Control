"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { useUnsavedChangesWarning } from "@/lib/use-unsaved-changes";
import { saveWorkLog } from "./actions";

type Props = {
  dayValue: string;
  initialNote: string;
};

export default function WorkLogForm({ dayValue, initialNote }: Props) {
  const [saved, setSaved] = useState(initialNote);
  const [value, setValue] = useState(initialNote);
  const dirty = value !== saved;
  useUnsavedChangesWarning(dirty);

  return (
    <ActionForm
      action={saveWorkLog}
      onSuccess={() => setSaved(value)}
      className="card mt-8 flex flex-col gap-3"
      aria-labelledby="work-log-title"
    >
      <input type="hidden" name="dayDate" value={dayValue} />
      <div>
        <h2 id="work-log-title" className="section-title">
          What actually happened
        </h2>
        <p id="work-log-hint" className="hint">
          Optional end-of-day log — wins, blockers, or notes from the workday.
        </p>
      </div>
      <div>
        <label htmlFor="work-log" className="sr-only">
          Work log
        </label>
        <textarea
          id="work-log"
          name="logNote"
          className="input"
          rows={4}
          placeholder="Shipped X, blocked on Y, next step Z…"
          aria-describedby="work-log-hint"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className="btn-primary touch-target" pendingLabel="Saving…">
          Save log
        </SubmitButton>
        <p className="text-sm text-amber-800 dark:text-amber-300" aria-live="polite">
          {dirty ? "Unsaved changes" : ""}
        </p>
      </div>
    </ActionForm>
  );
}
