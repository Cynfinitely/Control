"use client";

import { useMemo, useState } from "react";
import { buildRruleString, parseRruleParts } from "@/lib/calendar";
import { toDatetimeLocalValue } from "@/lib/calendar/format";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
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
  const toast = useToast();
  const [title, setTitle] = useState(initial.title);
  const [remindAt, setRemindAt] = useState(toDatetimeLocalValue(initial.remindAt));
  const [freq, setFreq] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(
    () => parseRruleParts(initial.rrule).freq
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formId = `reminder-form-${initial.id ?? "new"}`;

  const rrule = useMemo(() => {
    if (freq === "NONE") return null;
    return buildRruleString({ freq });
  }, [freq]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    const fd = new FormData();
    if (initial.id) fd.set("id", initial.id);
    fd.set("title", title);
    fd.set("remindAt", remindAt);
    if (rrule) fd.set("rrule", rrule);

    try {
      const result = mode === "create" ? await createReminder(fd) : await updateReminder(fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      toast.success(mode === "create" ? "Reminder created" : "Reminder saved");
      onSaved();
      onClose();
    } catch {
      setError("Couldn't save the reminder. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!initial.id) return;
    setConfirmDelete(false);
    setPending(true);
    const fd = new FormData();
    fd.set("id", initial.id);
    try {
      await deleteReminder(fd);
      toast.success("Reminder deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Couldn't delete the reminder. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={mode === "create" ? "New reminder" : "Edit reminder"}
        size="sm"
        footer={
          <>
            {mode === "edit" && (
              <button
                type="button"
                className="btn-danger sm:mr-auto"
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form={formId} className="btn-primary" disabled={pending}>
              {pending && <Spinner />}
              {mode === "create" ? "Create reminder" : "Save changes"}
            </button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          <div>
            <label className="label" htmlFor="rem-title">
              Title
            </label>
            <input
              id="rem-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-autofocus
            />
          </div>
          <div>
            <label className="label" htmlFor="rem-at">
              When
            </label>
            <input
              id="rem-at"
              type="datetime-local"
              className="input"
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
              className="input"
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
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete reminder?"
        message={`“${initial.title || "This reminder"}” will be removed. This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
