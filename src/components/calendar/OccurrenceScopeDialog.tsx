"use client";

import clsx from "clsx";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import type { OccurrenceScope } from "@/lib/calendar/types";

type Props = {
  open: boolean;
  mode: "edit" | "delete";
  onChoose: (scope: OccurrenceScope) => void;
  onCancel: () => void;
};

const OPTIONS: { scope: OccurrenceScope; label: string; hint: string }[] = [
  { scope: "this", label: "This occurrence", hint: "Only this date changes." },
  { scope: "thisAndFuture", label: "This and following", hint: "This date and every one after it." },
  { scope: "all", label: "Entire series", hint: "Every occurrence, past and future." },
];

export default function OccurrenceScopeDialog({ open, mode, onChoose, onCancel }: Props) {
  const isDelete = mode === "delete";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={isDelete ? "Delete recurring event" : "Save recurring event"}
      description={isDelete ? "Which occurrences do you want to delete?" : "Which occurrences should this change apply to?"}
      size="sm"
      footer={
        <button type="button" className="btn-ghost" onClick={onCancel} data-autofocus>
          Cancel
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.scope}
            type="button"
            onClick={() => onChoose(opt.scope)}
            className={clsx(
              "flex flex-col items-start rounded-lg px-4 py-3 text-left ring-1 ring-inset transition",
              isDelete
                ? "ring-red-200 hover:bg-red-50 dark:ring-red-900 dark:hover:bg-red-950"
                : "ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-700/50"
            )}
          >
            <span className={clsx("text-sm font-medium", isDelete ? "text-red-700 dark:text-red-400" : "text-slate-900 dark:text-slate-100")}>
              {isDelete ? `Delete ${opt.label.toLowerCase()}` : opt.label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{opt.hint}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/** Confirm for non-recurring deletes. */
export function DeleteConfirm({
  open,
  onConfirm,
  onCancel,
  title = "Delete event?",
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      title={title}
      message="This can't be undone."
      confirmLabel="Delete"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
