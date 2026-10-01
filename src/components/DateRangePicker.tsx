"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  from: string;
  to: string;
  /** Called only with a valid range (from ≤ to). */
  onChange: (from: string, to: string) => void;
  summary?: React.ReactNode;
  max?: string;
};

/** Labelled From/To date inputs with range validation. */
export default function DateRangePicker({ from, to, onChange, summary, max }: Props) {
  const id = useId();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  useEffect(() => setDraftFrom(from), [from]);
  useEffect(() => setDraftTo(to), [to]);

  const invalid = Boolean(draftFrom && draftTo && draftFrom > draftTo);

  function commit(nextFrom: string, nextTo: string) {
    if (!nextFrom || !nextTo || nextFrom > nextTo) return;
    if (nextFrom === from && nextTo === to) return;
    onChange(nextFrom, nextTo);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label" htmlFor={`${id}-from`}>
          From
        </label>
        <input
          id={`${id}-from`}
          type="date"
          value={draftFrom}
          max={max}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraftFrom(e.target.value);
            commit(e.target.value, draftTo);
          }}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor={`${id}-to`}>
          To
        </label>
        <input
          id={`${id}-to`}
          type="date"
          value={draftTo}
          max={max}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(e) => {
            setDraftTo(e.target.value);
            commit(draftFrom, e.target.value);
          }}
          className="input"
        />
      </div>
      {invalid ? (
        <p id={`${id}-error`} role="alert" className="field-error pb-2.5">
          “From” must be on or before “To”.
        </p>
      ) : (
        summary && <p className="pb-2.5 text-sm text-slate-600 dark:text-slate-400">{summary}</p>
      )}
    </div>
  );
}
