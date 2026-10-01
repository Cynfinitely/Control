"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { TIMEZONES, isValidTimezone } from "@/lib/timezones";
import { buildRruleString, describeRrule, parseRruleParts } from "@/lib/calendar";
import type { OccurrenceScope } from "@/lib/calendar/types";
import { toDatetimeLocalValue } from "@/lib/calendar/format";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import OccurrenceScopeDialog, { DeleteConfirm } from "./OccurrenceScopeDialog";
import { createEvent, updateEvent, deleteEvent } from "@/app/dashboard/calendar/actions";

const OFFSET_PRESETS = [
  { label: "At time", value: 0 },
  { label: "15 min before", value: 15 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

const WEEKDAYS = [
  { label: "Mon", full: "Monday", value: 0 },
  { label: "Tue", full: "Tuesday", value: 1 },
  { label: "Wed", full: "Wednesday", value: 2 },
  { label: "Thu", full: "Thursday", value: 3 },
  { label: "Fri", full: "Friday", value: 4 },
  { label: "Sat", full: "Saturday", value: 5 },
  { label: "Sun", full: "Sunday", value: 6 },
];

const FREQ_UNIT: Record<string, string> = {
  DAILY: "day(s)",
  WEEKLY: "week(s)",
  MONTHLY: "month(s)",
  YEARLY: "year(s)",
};

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

function isoWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

const chipClass = (active: boolean) =>
  clsx("chip min-h-[40px]", active ? "chip-active" : "chip-idle");

export default function EventForm({ open, mode, initial, onClose, onSaved }: Props) {
  const toast = useToast();
  const initialRule = useMemo(() => parseRruleParts(initial.rrule), [initial.rrule]);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(initial.startsAt, initial.timezone));
  const [endsAt, setEndsAt] = useState(toDatetimeLocalValue(initial.endsAt, initial.timezone));
  const [timezone, setTimezone] = useState(initial.timezone);
  const [freq, setFreq] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(initialRule.freq);
  const [interval, setInterval] = useState(initialRule.interval);
  const [byweekday, setByweekday] = useState<number[]>(
    initialRule.byweekday.length ? initialRule.byweekday : [isoWeekday(initial.startsAt)]
  );
  const [until, setUntil] = useState(initialRule.until ? initialRule.until.toISOString().slice(0, 10) : "");
  const [offsets, setOffsets] = useState<number[]>(initial.reminderOffsets ?? (mode === "create" ? [15] : []));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingScopeAction, setPendingScopeAction] = useState<"edit" | "delete" | null>(null);

  const timezoneOptions = isValidTimezone(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];
  const formId = `event-form-${initial.id ?? "new"}`;

  const rrule = useMemo(() => {
    if (freq === "NONE") return null;
    return buildRruleString({
      freq,
      interval,
      byweekday: freq === "WEEKLY" ? byweekday : undefined,
      until: until ? new Date(until) : undefined,
    });
  }, [freq, interval, byweekday, until]);

  const endBeforeStart = Boolean(startsAt && endsAt && endsAt < startsAt);

  function toggleOffset(v: number) {
    setOffsets((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)));
  }

  function toggleWeekday(v: number) {
    setByweekday((prev) => {
      if (prev.includes(v)) return prev.length > 1 ? prev.filter((x) => x !== v) : prev;
      return [...prev, v].sort((a, b) => a - b);
    });
  }

  async function submitWithScope(scope: OccurrenceScope = "all") {
    setError(null);
    setPending(true);
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

    try {
      const result = mode === "create" ? await createEvent(fd) : await updateEvent(fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      toast.success(mode === "create" ? "Event created" : "Event saved");
      onSaved();
      onClose();
    } catch {
      setError("Couldn't save the event. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (endBeforeStart) {
      setError("End must be after start.");
      return;
    }
    if (mode === "edit" && initial.isRecurring) {
      setPendingScopeAction("edit");
      setScopeOpen(true);
      return;
    }
    void submitWithScope("all");
  }

  function handleDelete() {
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
    setPending(true);
    const fd = new FormData();
    fd.set("id", initial.id);
    fd.set("scope", scope);
    if (initial.originalStartsAt) {
      fd.set("originalStartsAt", initial.originalStartsAt.toISOString());
    }
    try {
      await deleteEvent(fd);
      toast.success("Event deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Couldn't delete the event. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={mode === "create" ? "New event" : "Edit event"}
        footer={
          <>
            {mode === "edit" && (
              <button type="button" className="btn-danger sm:mr-auto" onClick={handleDelete} disabled={pending}>
                Delete
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form={formId} className="btn-primary" disabled={pending}>
              {pending && <Spinner />}
              {mode === "create" ? "Create event" : "Save changes"}
            </button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <div>
            <label className="label" htmlFor="ev-title">
              Title
            </label>
            <input
              id="ev-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-autofocus
            />
          </div>

          <label className="flex min-h-[40px] items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
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
                className="input"
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
                className="input"
                value={endsAt}
                min={startsAt}
                aria-invalid={endBeforeStart || undefined}
                aria-describedby={endBeforeStart ? "ev-end-error" : undefined}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
              {endBeforeStart && (
                <p id="ev-end-error" className="field-error">
                  End must be after start.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ev-loc">
                Location
              </label>
              <input id="ev-loc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ev-tz">
                Timezone
              </label>
              <select id="ev-tz" className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="ev-desc">
              Notes
            </label>
            <textarea
              id="ev-desc"
              className="input"
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

          {freq !== "NONE" && (
            <div className="space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="ev-interval">
                  Every
                </label>
                <input
                  id="ev-interval"
                  type="number"
                  min={1}
                  className="input w-20"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{FREQ_UNIT[freq]}</span>
              </div>
              {freq === "WEEKLY" && (
                <fieldset>
                  <legend className="label">On</legend>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        aria-pressed={byweekday.includes(d.value)}
                        aria-label={d.full}
                        className={chipClass(byweekday.includes(d.value))}
                        onClick={() => toggleWeekday(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div>
                <label className="label" htmlFor="ev-until">
                  Ends on <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  id="ev-until"
                  type="date"
                  className="input sm:max-w-xs"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </div>
              {rrule && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Repeats <span className="font-medium text-slate-800 dark:text-slate-200">{describeRrule(rrule)}</span>
                </p>
              )}
            </div>
          )}

          <fieldset>
            <legend className="label">Reminders</legend>
            <div className="flex flex-wrap gap-2">
              {OFFSET_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={offsets.includes(p.value)}
                  className={chipClass(offsets.includes(p.value))}
                  onClick={() => toggleOffset(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {offsets.length === 0 && <p className="hint">No reminder will be sent.</p>}
          </fieldset>
        </form>
      </Modal>

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
