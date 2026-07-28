"use client";

import { useMemo, useState } from "react";
import { TIMEZONES, isValidTimezone } from "@/lib/timezones";
import { buildRruleString } from "@/lib/calendar";
import type { OccurrenceScope } from "@/lib/calendar/types";
import { toDatetimeLocalValue } from "@/lib/calendar/format";
import SubmitButton from "@/components/SubmitButton";
import OccurrenceScopeDialog, { DeleteConfirm } from "./OccurrenceScopeDialog";
import { createEvent, updateEvent, deleteEvent } from "@/app/dashboard/calendar/actions";

const OFFSET_PRESETS = [
  { label: "At time", value: 0 },
  { label: "15 min before", value: 15 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

const WEEKDAYS = [
  { label: "Mon", value: 0 },
  { label: "Tue", value: 1 },
  { label: "Wed", value: 2 },
  { label: "Thu", value: 3 },
  { label: "Fri", value: 4 },
  { label: "Sat", value: 5 },
  { label: "Sun", value: 6 },
];

export type EventFormValues = {
  id?: string;
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  rrule: string | null;
  originalStartsAt?: Date;
  isRecurring?: boolean;
  reminderOffsets?: number[];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial: EventFormValues;
  onClose: () => void;
  onSaved: () => void;
};

export default function EventForm({ open, mode, initial, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(initial.startsAt, initial.timezone));
  const [endsAt, setEndsAt] = useState(toDatetimeLocalValue(initial.endsAt, initial.timezone));
  const [timezone, setTimezone] = useState(initial.timezone);
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
  const [interval, setInterval] = useState(1);
  const [byweekday, setByweekday] = useState<number[]>([1]);
  const [until, setUntil] = useState("");
  const [offsets, setOffsets] = useState<number[]>(initial.reminderOffsets ?? [15]);
  const [error, setError] = useState<string | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingScopeAction, setPendingScopeAction] = useState<"edit" | "delete" | null>(null);

  const timezoneOptions = isValidTimezone(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  const rrule = useMemo(() => {
    if (freq === "NONE") return null;
    return buildRruleString({
      freq,
      interval,
      byweekday: freq === "WEEKLY" ? byweekday : undefined,
      until: until ? new Date(until) : undefined,
    });
  }, [freq, interval, byweekday, until]);

  if (!open) return null;

  function toggleOffset(v: number) {
    setOffsets((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)));
  }

  function toggleWeekday(v: number) {
    setByweekday((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)
    );
  }

  async function submitWithScope(scope: OccurrenceScope = "all") {
    setError(null);
    const fd = new FormData();
    if (initial.id) fd.set("id", initial.id);
    fd.set("title", title);
    fd.set("description", description);
    fd.set("location", location);
    fd.set("allDay", allDay ? "true" : "false");
    fd.set("startsAt", startsAt);
    fd.set("endsAt", endsAt);
    fd.set("timezone", timezone);
    if (rrule) fd.set("rrule", rrule);
    fd.set("reminderOffsets", offsets.join(","));
    fd.set("scope", scope);
    if (initial.originalStartsAt) {
      fd.set("originalStartsAt", initial.originalStartsAt.toISOString());
    }

    const result =
      mode === "create" ? await createEvent(fd) : await updateEvent(fd);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "edit" && initial.isRecurring) {
      setPendingScopeAction("edit");
      setScopeOpen(true);
      return;
    }
    await submitWithScope("all");
  }

  async function handleDelete() {
    if (!initial.id) return;
    if (initial.isRecurring) {
      setPendingScopeAction("delete");
      setScopeOpen(true);
      return;
    }
    setDeleteOpen(true);
  }

  async function confirmDelete(scope: OccurrenceScope = "all") {
    if (!initial.id) return;
    const fd = new FormData();
    fd.set("id", initial.id);
    fd.set("scope", scope);
    if (initial.originalStartsAt) {
      fd.set("originalStartsAt", initial.originalStartsAt.toISOString());
    }
    await deleteEvent(fd);
    onSaved();
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
        <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
        <form
          onSubmit={handleSubmit}
          className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl shadow-xl sm:rounded-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {mode === "create" ? "New event" : "Edit event"}
            </h2>
            <button type="button" className="btn-ghost text-sm" onClick={onClose}>
              Close
            </button>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="ev-title">
                Title
              </label>
              <input
                id="ev-title"
                className="input w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              All day
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="ev-start">
                  Starts
                </label>
                <input
                  id="ev-start"
                  type="datetime-local"
                  className="input w-full"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="ev-end">
                  Ends
                </label>
                <input
                  id="ev-end"
                  type="datetime-local"
                  className="input w-full"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="ev-tz">
                Timezone
              </label>
              <select
                id="ev-tz"
                className="input w-full"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="ev-loc">
                Location
              </label>
              <input
                id="ev-loc"
                className="input w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-desc">
                Notes
              </label>
              <textarea
                id="ev-desc"
                className="input w-full"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="ev-freq">
                Repeat
              </label>
              <select
                id="ev-freq"
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

            {freq !== "NONE" && (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div>
                  <label className="label" htmlFor="ev-interval">
                    Every
                  </label>
                  <input
                    id="ev-interval"
                    type="number"
                    min={1}
                    className="input w-24"
                    value={interval}
                    onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <span className="ml-2 text-sm text-slate-500">
                    {freq === "DAILY"
                      ? "day(s)"
                      : freq === "WEEKLY"
                        ? "week(s)"
                        : freq === "MONTHLY"
                          ? "month(s)"
                          : "year(s)"}
                  </span>
                </div>
                {freq === "WEEKLY" && (
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className={
                          byweekday.includes(d.value)
                            ? "btn-primary touch-target px-3 text-xs"
                            : "btn-ghost touch-target px-3 text-xs"
                        }
                        onClick={() => toggleWeekday(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="ev-until">
                    Until (optional)
                  </label>
                  <input
                    id="ev-until"
                    type="date"
                    className="input w-full"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </div>
                {rrule && (
                  <p className="font-mono text-xs text-slate-400 break-all">RRULE:{rrule}</p>
                )}
              </div>
            )}

            <div>
              <p className="label">Reminders</p>
              <div className="flex flex-wrap gap-2">
                {OFFSET_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={
                      offsets.includes(p.value)
                        ? "btn-primary touch-target px-3 text-xs"
                        : "btn-ghost touch-target px-3 text-xs"
                    }
                    onClick={() => toggleOffset(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
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

      <OccurrenceScopeDialog
        open={scopeOpen}
        mode={pendingScopeAction === "delete" ? "delete" : "edit"}
        onCancel={() => {
          setScopeOpen(false);
          setPendingScopeAction(null);
        }}
        onChoose={async (scope) => {
          setScopeOpen(false);
          if (pendingScopeAction === "delete") {
            await confirmDelete(scope);
          } else {
            await submitWithScope(scope);
          }
          setPendingScopeAction(null);
        }}
      />

      <DeleteConfirm
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false);
          await confirmDelete("all");
        }}
      />
    </>
  );
}
