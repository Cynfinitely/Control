export type OccurrenceScope = "this" | "thisAndFuture" | "all";

export type CalendarEventMaster = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  rrule: string | null;
  rruleUntil: Date | null;
  status: string;
};

export type CalendarEventExceptionInput = {
  originalStartsAt: Date;
  cancelled: boolean;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  allDay?: boolean | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export type EventOccurrence = {
  eventId: string;
  originalStartsAt: Date;
  startsAt: Date;
  endsAt: Date;
  title: string;
  description: string | null;
  location: string | null;
  allDay: boolean;
  isException: boolean;
  isRecurring: boolean;
  rrule: string | null;
};

export type RruleBuilderInput = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval?: number;
  byweekday?: number[]; // 0=Mon .. 6=Sun (ISO), converted for rrule
  bymonthday?: number[];
  count?: number;
  until?: Date;
};

export type DueReminderCandidate = {
  reminderId: string;
  eventId: string | null;
  title: string;
  dueAt: Date;
  dedupeKey: string;
  href: string;
  sourceType: "event" | "reminder";
  sourceId: string;
};
