import type {
  CalendarEventExceptionInput,
  CalendarEventMaster,
  EventOccurrence,
} from "./types";
import { durationMs, expandRruleStarts } from "./rrule";

function sameInstant(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function applyException(
  master: CalendarEventMaster,
  originalStartsAt: Date,
  endsAt: Date,
  exception: CalendarEventExceptionInput | undefined
): EventOccurrence | null {
  if (exception?.cancelled) return null;

  const isException = Boolean(exception && !exception.cancelled);
  return {
    eventId: master.id,
    originalStartsAt,
    startsAt: exception?.startsAt ?? originalStartsAt,
    endsAt: exception?.endsAt ?? endsAt,
    title: exception?.title ?? master.title,
    description: exception?.description !== undefined ? exception.description : master.description,
    location: exception?.location !== undefined ? exception.location : master.location,
    allDay: exception?.allDay ?? master.allDay,
    isException,
    isRecurring: Boolean(master.rrule),
    rrule: master.rrule,
  };
}

export function expandEventOccurrences(
  master: CalendarEventMaster,
  exceptions: CalendarEventExceptionInput[],
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  if (master.status === "cancelled") return [];

  const exceptionMap = new Map(
    exceptions.map((e) => [e.originalStartsAt.getTime(), e] as const)
  );
  const duration = durationMs(master.startsAt, master.endsAt);
  const results: EventOccurrence[] = [];

  if (!master.rrule) {
    if (master.endsAt >= rangeStart && master.startsAt <= rangeEnd) {
      const occ = applyException(
        master,
        master.startsAt,
        master.endsAt,
        exceptionMap.get(master.startsAt.getTime())
      );
      if (occ) results.push(occ);
    }
    return results;
  }

  const starts = expandRruleStarts(
    master.rrule,
    master.startsAt,
    master.timezone,
    rangeStart,
    rangeEnd
  );

  // Also include exception overrides whose new start falls in range but original might be outside
  for (const ex of exceptions) {
    if (ex.cancelled || !ex.startsAt) continue;
    if (ex.startsAt >= rangeStart && ex.startsAt <= rangeEnd) {
      const key = ex.originalStartsAt.getTime();
      if (!starts.some((s) => s.getTime() === key)) {
        starts.push(ex.originalStartsAt);
      }
    }
  }

  starts.sort((a, b) => a.getTime() - b.getTime());

  for (const start of starts) {
    const end = new Date(start.getTime() + duration);
    const ex = exceptionMap.get(start.getTime());
    const occ = applyException(master, start, end, ex);
    if (occ) results.push(occ);
  }

  return results;
}

export function findException(
  exceptions: CalendarEventExceptionInput[],
  originalStartsAt: Date
): CalendarEventExceptionInput | undefined {
  return exceptions.find((e) => sameInstant(e.originalStartsAt, originalStartsAt));
}
