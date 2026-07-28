"use client";

import { useMemo, useState } from "react";
import { buildRruleString } from "@/lib/calendar";
import { toDatetimeLocalValue } from "@/lib/calendar/format";
import SubmitButton from "@/components/SubmitButton";
import { createReminder, updateReminder, deleteReminder } from "@/app/dashboard/calendar/actions";

export type ReminderFormValues = {
  id?: string;
  title: string;
  remindAt: Date;
  rrule: string | null;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial: ReminderFormValues;
  onClose: () => void;
  onSaved: () => void;
};

export default function ReminderForm({ open, mode, initial, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [remindAt, setRemindAt] = useState(toDatetimeLocalValue(initial.remindAt));
  const [freq, setFreq] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(
    initial.rrule?.includes("YEARLY")
      ? "YEARLY"
      : initial.rrule?.includes("MONTHLY")
        ? "MONTHLY"
        : initial.rrule?.includes("WEEKLY")
          ? "WEEKLY"
          : initial.rrule?.includes("DAILY")
            ? "DAILY"
            : "NONE"
  );
  const [error, setError] = useState<string | null>(null);

  const rrule = useMemo(() => {
    if (freq === "NONE") return null;
    return buildRruleString({ freq });
  }, [freq]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    if (initial.id) fd.set("id", initial.id);
    fd.set("title", title);
    fd.set("remindAt", remindAt);
    if (rrule) fd.set("rrule", rrule);

    const result =
      mode === "create" ? await createReminder(fd) : await updateReminder(fd);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!initial.id) return;
    const fd = new FormData();
    fd.set("id", initial.id);
    await deleteReminder(fd);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="card relative z-10 w-full max-w-md space-y-3 rounded-t-2xl shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {mode === "create" ? "New reminder" : "Edit reminder"}
          </h2>
          <button type="button" className="btn-ghost text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="label" htmlFor="rem-title">
            Title
          </label>
          <input
            id="rem-title"
            className="input w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="rem-at">
            When
          </label>
          <input
            id="rem-at"
            type="datetime-local"
            className="input w-full"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="rem-freq">
            Repeat
          </label>
          <select
            id="rem-freq"
            className="input w-full"
            value={freq}
            onChange={(e) => setFreq(e.target.value as typeof freq)}
          >
            <option value="NONE">Does not repeat</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <SubmitButton className="btn-primary touch-target">
            {mode === "create" ? "Create" : "Save"}
          </SubmitButton>
          {mode === "edit" && (
            <button type="button" className="btn-danger touch-target" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
