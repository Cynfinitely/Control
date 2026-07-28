"use client";

import ConfirmDialog from "@/components/ConfirmDialog";
import type { OccurrenceScope } from "@/lib/calendar/types";

type Props = {
  open: boolean;
  mode: "edit" | "delete";
  onChoose: (scope: OccurrenceScope) => void;
  onCancel: () => void;
};

export default function OccurrenceScopeDialog({ open, mode, onChoose, onCancel }: Props) {
  if (!open) return null;

  const verb = mode === "delete" ? "Delete" : "Edit";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Cancel" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${verb} recurring event`}
        className="card relative z-10 w-full max-w-sm space-y-3 shadow-xl"
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {verb} recurring event
        </h2>
        <p className="text-sm text-slate-500">This is part of a series. What should change?</p>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn touch-target justify-start" onClick={() => onChoose("this")}>
            This occurrence
          </button>
          <button
            type="button"
            className="btn touch-target justify-start"
            onClick={() => onChoose("thisAndFuture")}
          >
            This and future
          </button>
          <button type="button" className="btn touch-target justify-start" onClick={() => onChoose("all")}>
            Entire series
          </button>
          <button type="button" className="btn-ghost touch-target" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Simple confirm for non-recurring deletes — re-export pattern helper */
export function DeleteConfirm({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete event?"
      message="This cannot be undone."
      confirmLabel="Delete"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
