"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventOccurrence } from "@/lib/calendar/types";
import { addDays, startOfWeek, toDateInputValue, formatDate } from "@/lib/date";
import MonthNavigator from "@/components/MonthNavigator";
import DayNavigator from "@/components/DayNavigator";
import StepNavigator from "@/components/StepNavigator";
import SegmentedControl from "@/components/SegmentedControl";
import Icon from "@/components/Icon";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import DayColumn from "./DayColumn";
import AgendaList from "./AgendaList";
import EventForm, { type EventFormValues } from "./EventForm";
import ReminderForm, { type ReminderFormValues } from "./ReminderForm";

export type SerializedOccurrence = {
  eventId: string;
  originalStartsAt: string;
  startsAt: string;
  endsAt: string;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  isException: boolean;
  isRecurring: boolean;
  rrule: string | null;
  reminderOffsets?: number[];
};

export type SerializedReminder = {
  id: string;
  title: string | null;
  remindAt: string | null;
  rrule: string | null;
};

type View = "month" | "week" | "day" | "agenda";

type Props = {
  timezone: string;
  monthKey: string;
  monthLabel: string;
  dayValue: string;
  dayLabel: string;
  view: View;
  occurrences: SerializedOccurrence[];
  reminders: SerializedReminder[];
  focusEventId?: string;
  /** ISO originalStartsAt of the focused occurrence */
  focusAt?: string;
  focusReminder?: SerializedReminder;
  initialCreate?: "event" | "reminder" | null;
};

function reviveOcc(o: SerializedOccurrence): EventOccurrence {
  return {
    ...o,
    originalStartsAt: new Date(o.originalStartsAt),
    startsAt: new Date(o.startsAt),
    endsAt: new Date(o.endsAt),
  };
}

function parseDay(dayValue: string): Date {
  const d = new Date(dayValue + "T00:00:00");
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

type EventFormState = { mode: "create" | "edit"; values: EventFormValues };
type ReminderFormState = {
  mode: "create" | "edit";
  values: ReminderFormValues;
};

function newEventForm(day: Date, timezone: string): EventFormState {
  const { startsAt, endsAt } = defaultEventTimes(day);
  return {
    mode: "create",
    values: {
      title: "",
      description: "",
      location: "",
      allDay: false,
      startsAt,
      endsAt,
      timezone,
      rrule: null,
      reminderOffsets: [15],
    },
  };
}

function occurrenceForm(
  occ: EventOccurrence,
  timezone: string
): EventFormState {
  return {
    mode: "edit",
    values: {
      id: occ.eventId,
      title: occ.title,
      description: occ.description ?? "",
      location: occ.location ?? "",
      allDay: occ.allDay,
      startsAt: occ.startsAt,
      endsAt: occ.endsAt,
      timezone,
      rrule: occ.rrule,
      originalStartsAt: occ.originalStartsAt,
      isRecurring: occ.isRecurring,
      reminderOffsets: occ.reminderOffsets ?? [],
    },
  };
}

function newReminderForm(day: Date): ReminderFormState {
  const remindAt = new Date(day);
  remindAt.setHours(9, 0, 0, 0);
  return { mode: "create", values: { title: "", remindAt, rrule: null } };
}

function editReminderForm(rem: SerializedReminder): ReminderFormState {
  return {
    mode: "edit",
    values: {
      id: rem.id,
      title: rem.title || "",
      remindAt: new Date(rem.remindAt!),
      rrule: rem.rrule,
    },
  };
}

function defaultEventTimes(day: Date): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(day);
  startsAt.setHours(10, 0, 0, 0);
  const endsAt = new Date(day);
  endsAt.setHours(11, 0, 0, 0);
  return { startsAt, endsAt };
}

export default function CalendarShell({
  timezone,
  monthKey,
  monthLabel,
  dayValue,
  dayLabel,
  view: initialView,
  occurrences: rawOccs,
  reminders: rawReminders,
  focusEventId,
  focusAt,
  focusReminder,
  initialCreate,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  // ?new=… opens a create form and a notification link (?event=…&at=… or
  // ?reminder=…) opens that item, once per mount. The link wins over ?new=.
  const [eventForm, setEventForm] = useState<EventFormState | null>(() => {
    if (focusEventId) {
      const raw =
        rawOccs.find(
          o =>
            o.eventId === focusEventId &&
            (!focusAt ||
              reviveOcc(o).originalStartsAt.toISOString() === focusAt)
        ) ?? rawOccs.find(o => o.eventId === focusEventId);
      if (raw) return occurrenceForm(reviveOcc(raw), timezone);
    }
    return initialCreate === "event"
      ? newEventForm(parseDay(dayValue), timezone)
      : null;
  });
  const [reminderForm, setReminderForm] = useState<ReminderFormState | null>(
    () => {
      if (!focusEventId && focusReminder?.remindAt)
        return editReminderForm(focusReminder);
      return initialCreate === "reminder"
        ? newReminderForm(parseDay(dayValue))
        : null;
    }
  );

  const occurrences = useMemo(() => rawOccs.map(reviveOcc), [rawOccs]);
  const reminders = useMemo(
    () =>
      rawReminders
        .filter(r => r.remindAt)
        .map(r => ({
          id: r.id,
          title: r.title || "Reminder",
          remindAt: new Date(r.remindAt!),
        })),
    [rawReminders]
  );

  const day = useMemo(() => parseDay(dayValue), [dayValue]);

  const weekStart = useMemo(() => startOfWeek(day), [day]);

  function refresh() {
    router.refresh();
  }

  function setViewAndUrl(next: View) {
    setView(next);
    const params = new URLSearchParams();
    params.set("view", next);
    if (next === "month") params.set("month", monthKey);
    else params.set("day", dayValue);
    router.push(`/dashboard/calendar?${params.toString()}`, { scroll: false });
  }

  function openCreate(at?: Date) {
    setEventForm(newEventForm(at ?? day, timezone));
  }

  function openOccurrence(occ: EventOccurrence) {
    setEventForm(occurrenceForm(occ, timezone));
  }

  function openReminder(id: string) {
    const rem = rawReminders.find(r => r.id === id);
    if (!rem || !rem.remindAt) return;
    setReminderForm(editReminderForm(rem));
  }

  function openCreateReminder() {
    setReminderForm(newReminderForm(day));
  }

  function selectDay(d: Date) {
    const params = new URLSearchParams();
    params.set("view", view === "month" ? "day" : view);
    params.set("day", toDateInputValue(d));
    router.push(`/dashboard/calendar?${params.toString()}`);
    if (view === "month") setView("day");
  }

  const isCurrentWeek =
    toDateInputValue(weekStart) === toDateInputValue(startOfWeek(new Date()));

  function weekHref(d: Date) {
    return `/dashboard/calendar?view=week&day=${toDateInputValue(startOfWeek(d))}`;
  }

  const views: { id: View; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
    { id: "agenda", label: "Agenda" },
  ];

  return (
    <div>
      <div className="card mb-4 space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {view === "month" ? (
            <MonthNavigator
              basePath="/dashboard/calendar"
              monthKey={monthKey}
              monthLabel={monthLabel}
              extraParams={{ view: "month" }}
            />
          ) : view === "week" ? (
            <StepNavigator
              label={`${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`}
              prev={{
                href: weekHref(addDays(weekStart, -7)),
                label: "Previous week",
              }}
              next={{
                href: weekHref(addDays(weekStart, 7)),
                label: "Next week",
              }}
              reset={
                isCurrentWeek
                  ? undefined
                  : {
                      href: weekHref(new Date()),
                      label: "Go to this week",
                      text: "This week",
                    }
              }
            />
          ) : view === "day" ? (
            <DayNavigator
              basePath="/dashboard/calendar"
              dayValue={dayValue}
              dayLabel={dayLabel}
              extraParams={{ view }}
            />
          ) : (
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Next 60 days
            </p>
          )}

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              className="btn-ghost flex-1 sm:flex-none"
              onClick={openCreateReminder}
            >
              <Icon name="bell" className="h-4 w-4" />
              Reminder
            </button>
            <button
              type="button"
              className="btn-primary flex-1 sm:flex-none"
              onClick={() => openCreate()}
            >
              <Icon name="plus" className="h-4 w-4" />
              New event
            </button>
          </div>
        </div>

        <SegmentedControl
          aria-label="Calendar view"
          options={views.map(v => ({ value: v.id, label: v.label }))}
          value={view}
          onChange={setViewAndUrl}
          fill
          className="sm:w-auto"
        />
      </div>

      {view === "month" && (
        <MonthGrid
          monthKey={monthKey}
          timezone={timezone}
          occurrences={occurrences}
          reminders={reminders}
          onSelectDay={selectDay}
          onSelectOccurrence={openOccurrence}
          onSelectReminder={openReminder}
          onCreateAt={openCreate}
        />
      )}
      {view === "week" && (
        <WeekGrid
          weekStart={weekStart}
          timezone={timezone}
          occurrences={occurrences}
          reminders={reminders}
          onSelectOccurrence={openOccurrence}
          onSelectReminder={openReminder}
          onCreateAt={openCreate}
        />
      )}
      {view === "day" && (
        <DayColumn
          day={day}
          timezone={timezone}
          occurrences={occurrences}
          reminders={reminders}
          onSelectOccurrence={openOccurrence}
          onSelectReminder={openReminder}
          onCreate={() => openCreate(day)}
        />
      )}
      {view === "agenda" && (
        <AgendaList
          timezone={timezone}
          occurrences={occurrences}
          reminders={reminders}
          onSelectOccurrence={openOccurrence}
          onSelectReminder={openReminder}
          onCreate={() => openCreate()}
        />
      )}

      {eventForm && (
        <EventForm
          key={`ev-${eventForm.mode}-${eventForm.values.id ?? "new"}-${eventForm.values.startsAt.toISOString()}`}
          open
          mode={eventForm.mode}
          initial={eventForm.values}
          onClose={() => setEventForm(null)}
          onSaved={refresh}
        />
      )}
      {reminderForm && (
        <ReminderForm
          key={`rem-${reminderForm.mode}-${reminderForm.values.id ?? "new"}`}
          open
          mode={reminderForm.mode}
          initial={reminderForm.values}
          onClose={() => setReminderForm(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
