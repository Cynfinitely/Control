"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { saveReviewNotes } from "./actions";

export default function ReviewNotes({ weekKey, notes }: { weekKey: string; notes: string }) {
  const [value, setValue] = useState(notes);
  const [saved, setSaved] = useState(notes);
  const dirty = value !== saved;

  return (
    <ActionForm action={saveReviewNotes} successMessage="Notes saved" onSuccess={() => setSaved(value)} className="space-y-3">
      <input type="hidden" name="weekKey" value={weekKey} />
      <label htmlFor="review-notes" className="sr-only">
        Review notes
      </label>
      <textarea
        id="review-notes"
        name="notes"
        rows={4}
        className="input"
        placeholder="Wins, lessons, and what to focus on next week…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={10000}
      />
      <div className="flex items-center gap-3">
        <SubmitButton className="btn-ghost btn-sm min-h-[36px]" disabled={!dirty}>
          Save notes
        </SubmitButton>
        {dirty && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </ActionForm>
  );
}
