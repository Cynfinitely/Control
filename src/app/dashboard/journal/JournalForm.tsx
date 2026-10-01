"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { useUnsavedChangesWarning } from "@/lib/use-unsaved-changes";
import { saveJournalEntry } from "./actions";

const MOODS = [
  { value: "1", label: "1 · Very low" },
  { value: "2", label: "2 · Low" },
  { value: "3", label: "3 · Okay" },
  { value: "4", label: "4 · Good" },
  { value: "5", label: "5 · Great" },
];

type Entry = {
  mood: string;
  wins: string;
  blockers: string;
  note: string;
};

type Props = {
  dayValue: string;
  dayLabel: string;
  initial: Entry;
};

function snapshot(form: HTMLFormElement): string {
  const fd = new FormData(form);
  const get = (k: string) => String(fd.get(k) ?? "");
  return JSON.stringify([get("mood"), get("wins"), get("blockers"), get("note")]);
}

export default function JournalForm({ dayValue, dayLabel, initial }: Props) {
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify([initial.mood, initial.wins, initial.blockers, initial.note])
  );
  const [current, setCurrent] = useState(baseline);
  const dirty = current !== baseline;
  const hasEntry = Boolean(initial.mood || initial.wins || initial.blockers || initial.note);
  useUnsavedChangesWarning(dirty);

  return (
    <ActionForm
      action={saveJournalEntry}
      onChange={(e) => setCurrent(snapshot(e.currentTarget))}
      onSuccess={() => setBaseline(current)}
      className="card flex flex-col gap-4"
      aria-labelledby="journal-form-title"
    >
      <input type="hidden" name="date" value={dayValue} />
      <div>
        <h2 id="journal-form-title" className="section-title">
          {dayLabel === "Today" ? "Today's reflection" : `Reflection · ${dayLabel}`}
        </h2>
        <p className="hint">
          {hasEntry ? "Edit and save to update this day's entry." : "Even a few words each day adds up over time."}
        </p>
      </div>
      <div>
        <label htmlFor="journal-mood" className="label">
          Mood
        </label>
        <select id="journal-mood" name="mood" className="input sm:w-48" defaultValue={initial.mood}>
          <option value="">Not set</option>
          {MOODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="journal-wins" className="label">
          Wins
        </label>
        <textarea
          id="journal-wins"
          name="wins"
          className="input"
          rows={2}
          placeholder="What went well?"
          defaultValue={initial.wins}
        />
      </div>
      <div>
        <label htmlFor="journal-blockers" className="label">
          Blockers
        </label>
        <textarea
          id="journal-blockers"
          name="blockers"
          className="input"
          rows={2}
          placeholder="What got in the way?"
          defaultValue={initial.blockers}
        />
      </div>
      <div>
        <label htmlFor="journal-note" className="label">
          Notes
        </label>
        <textarea
          id="journal-note"
          name="note"
          className="input"
          rows={3}
          placeholder="Anything else on your mind…"
          defaultValue={initial.note}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className="btn-primary touch-target" pendingLabel="Saving…">
          Save entry
        </SubmitButton>
        <p className="text-sm text-amber-800 dark:text-amber-300" aria-live="polite">
          {dirty ? "Unsaved changes" : ""}
        </p>
      </div>
    </ActionForm>
  );
}
