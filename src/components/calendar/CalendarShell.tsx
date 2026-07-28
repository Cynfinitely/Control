"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { EventOccurrence } from "@/lib/calendar/types";
import { addDays, startOfWeek, toDateInputValue, toMonthKey, formatDate } from "@/lib/date";
import MonthNavigator from "@/components/MonthNavigator";
import DayNavigator from "@/components/DayNavigator";
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
  focusReminderId?: string;
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
  initialCreate,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [eventForm, setEventForm] = useState<{
    mode: "create" | "edit";
    values: EventFormValues;
  } | null>(null);
  const [reminderForm, setReminderForm] = useState<{
    mode: "create" | "edit";
    values: ReminderFormValues;
  } | null>(null);
  const [bootedCreate, setBootedCreate] = useState(false);

  const occurrences = useMemo(() => rawOccs.map(reviveOcc), [rawOccs]);
  const reminders = useMemo(
    () =>
      rawReminders
        .filter((r) => r.remindAt)
        .map((r) => ({
          id: r.id,
          title: r.title || "Reminder",
          remindAt: new Date(r.remindAt!),
        })),
    [rawReminders]
  );

  const day = useMemo(() => {
    const d = new Date(dayValue + "T00:00:00");
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [dayValue]);

  const weekStart = useMemo(() => startOfWeek(day), [day]);

  useEffect(() => {
    if (bootedCreate || !initialCreate) return;
    setBootedCreate(true);
    if (initialCreate === "event") {
      const { startsAt, endsAt } = defaultEventTimes(day);
      setEventForm({
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
      });
    } else {
      const remindAt = new Date(day);
      remindAt.setHours(9, 0, 0, 0);
      setReminderForm({
        mode: "create",
        values: { title: "", remindAt, rrule: null },
      });
    }
  }, [bootedCreate, initialCreate, day, timezone]);

  function refresh() {
    router.refresh();
  }

  function setViewAndUrl(next: View) {
    setView(next);
    const params = new URLSearchParams();
    params.set("view", next);
    if (next === "month") params.set("month", monthKey);
    else params.set("day", dayValue);
    router.push(`/dashboard/calendar?${params.toString()}`);
  }

  function openCreate(at?: Date) {
    const { startsAt, endsAt } = defaultEventTimes(at ?? day);
    setEventForm({
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
    });
  }

  function openOccurrence(occ: EventOccurrence) {
    setEventForm({
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
        reminderOffsets: [15],
      },
    });
  }

  function openReminder(id: string) {
    const rem = rawReminders.find((r) => r.id === id);
    if (!rem || !rem.remindAt) return;
    setReminderForm({
      mode: "edit",
      values: {
        id: rem.id,
        title: rem.title || "",
        remindAt: new Date(rem.remindAt),
        rrule: rem.rrule,
      },
    });
  }

  function openCreateReminder() {
    const remindAt = new Date(day);
    remindAt.setHours(9, 0, 0, 0);
    setReminderForm({
      mode: "create",
      values: { title: "", remindAt, rrule: null },
    });
  }

  function selectDay(d: Date) {
    const params = new URLSearchParams();
    params.set("view", view === "month" ? "day" : view);
    params.set("day", toDateInputValue(d));
    router.push(`/dashboard/calendar?${params.toString()}`);
    if (view === "month") setView("day");
  }

  const views: { id: View; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "day", label: "Day" },
    { id: "agenda", label: "Agenda" },
  ];

  return (
    <div>
      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
        {view === "month" ? (
          <MonthNavigator
            basePath="/dashboard/calendar"
            monthKey={monthKey}
            monthLabel={monthLabel}
            extraParams={{ view: "month" }}
          />
        ) : view === "week" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-ghost touch-target px-3"
              onClick={() => {
                const prev = addDays(weekStart, -7);
                router.push(
                  `/dashboard/calendar?view=week&day=${toDateInputValue(prev)}`
                );
              }}
            >
              ←
            </button>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Week of {formatDate(weekStart)}
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost touch-target px-3"
              onClick={() => {
                const next = addDays(weekStart, 7);
                router.push(
                  `/dashboard/calendar?view=week&day=${toDateInputValue(next)}`
                );
              }}
            >
              →
            </button>
          </div>
        ) : (
          <DayNavigator
            basePath="/dashboard/calendar"
            dayValue={dayValue}
            dayLabel={dayLabel}
            extraParams={{ view }}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary touch-target text-sm" onClick={() => openCreate()}>
            New event
          </button>
          <button type="button" className="btn touch-target text-sm" onClick={openCreateReminder}>
            Reminder
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 p-1 dark:border-slate-700">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setViewAndUrl(v.id)}
            className={clsx(
              "touch-target flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
              view === v.id
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              v.id === "month" && "hidden sm:block",
              v.id === "agenda" && "sm:flex-none"
            )}
          >
            {v.label}
          </button>
        ))}
        {/* Mobile prefers agenda; show month toggle separately on small screens via agenda default */}
        <button
          type="button"
          onClick={() => setViewAndUrl("month")}
          className={clsx(
            "touch-target flex-1 rounded-md px-3 py-1.5 text-sm font-medium sm:hidden",
            view === "month" ? "bg-brand-600 text-white" : "text-slate-600"
          )}
        >
          Month
        </button>
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
