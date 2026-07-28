import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  addDays,
  endOfDay,
  endOfMonth,
  formatDayLabel,
  parseDayParam,
  parseMonthParam,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateInputValue,
  toMonthKey,
} from "@/lib/date";
import { getOccurrencesInRange, getStandaloneReminders } from "@/lib/queries/calendar";
import PageHeader from "@/components/PageHeader";
import CalendarShell from "@/components/calendar/CalendarShell";
import { expandRruleStarts } from "@/lib/calendar";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: {
    view?: string;
    month?: string;
    day?: string;
    event?: string;
    reminder?: string;
    new?: string;
  };
}) {
  const user = await requireUser();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { timezone: true },
  });
  const timezone = profile?.timezone ?? "Europe/Istanbul";

  const viewRaw = searchParams.view ?? "month";
  const view =
    viewRaw === "week" || viewRaw === "day" || viewRaw === "agenda" || viewRaw === "month"
      ? viewRaw
      : "month";

  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const monthDate = searchParams.month ? parseMonthParam(searchParams.month) : startOfMonth(day);
  const monthKey = toMonthKey(monthDate);
  const monthLabel = monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === "month") {
    rangeStart = addDays(startOfMonth(monthDate), -7);
    rangeEnd = addDays(endOfMonth(monthDate), 7);
  } else if (view === "week") {
    rangeStart = startOfWeek(day);
    rangeEnd = endOfDay(addDays(rangeStart, 6));
  } else if (view === "day") {
    rangeStart = startOfDay(day);
    rangeEnd = endOfDay(day);
  } else {
    rangeStart = startOfDay(new Date());
    rangeEnd = endOfDay(addDays(rangeStart, 60));
  }

  const [occurrences, remindersRaw] = await Promise.all([
    getOccurrencesInRange(user.id, rangeStart, rangeEnd),
    getStandaloneReminders(user.id, rangeStart, rangeEnd),
  ]);

  // Expand recurring standalone reminders into chips for the visible range
  const reminderChips: { id: string; title: string | null; remindAt: string | null; rrule: string | null }[] =
    [];
  for (const r of remindersRaw) {
    if (r.rrule && r.remindAt) {
      const starts = expandRruleStarts(r.rrule, r.remindAt, timezone, rangeStart, rangeEnd);
      for (const s of starts) {
        reminderChips.push({
          id: r.id,
          title: r.title,
          remindAt: s.toISOString(),
          rrule: r.rrule,
        });
      }
    } else {
      reminderChips.push({
        id: r.id,
        title: r.title,
        remindAt: r.remindAt?.toISOString() ?? null,
        rrule: r.rrule,
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Events, reminders, and what is coming up — separate from your daily plan."
      />
      <CalendarShell
        timezone={timezone}
        monthKey={monthKey}
        monthLabel={monthLabel}
        dayValue={dayValue}
        dayLabel={dayLabel}
        view={view}
        occurrences={occurrences.map((o) => ({
          eventId: o.eventId,
          originalStartsAt: o.originalStartsAt.toISOString(),
          startsAt: o.startsAt.toISOString(),
          endsAt: o.endsAt.toISOString(),
          title: o.title,
          description: o.description,
          location: o.location,
          allDay: o.allDay,
          isException: o.isException,
          isRecurring: o.isRecurring,
          rrule: o.rrule,
        }))}
        reminders={reminderChips}
        focusEventId={searchParams.event}
        focusReminderId={searchParams.reminder}
        initialCreate={
          searchParams.new === "event" || searchParams.new === "reminder"
            ? searchParams.new
            : null
        }
      />
    </div>
  );
}
