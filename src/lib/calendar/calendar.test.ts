import { describe, expect, it } from "vitest";
import {
  buildRruleString,
  expandRruleStarts,
  expandEventOccurrences,
  computeDueReminders,
  parseRruleUntil,
} from "@/lib/calendar";
import type { CalendarEventMaster } from "@/lib/calendar/types";

describe("buildRruleString", () => {
  it("builds weekly on Mon/Wed", () => {
    const s = buildRruleString({ freq: "WEEKLY", interval: 1, byweekday: [0, 2] });
    expect(s).toContain("FREQ=WEEKLY");
    expect(s).toMatch(/BYDAY=.*(MO|WE)/);
  });

  it("supports until", () => {
    const until = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
    const s = buildRruleString({ freq: "DAILY", until });
    expect(s).toContain("UNTIL=");
    expect(parseRruleUntil(s)?.getUTCFullYear()).toBe(2026);
  });
});

describe("expandRruleStarts", () => {
  it("expands daily occurrences in range", () => {
    const dtstart = new Date("2026-07-01T09:00:00.000Z");
    const starts = expandRruleStarts(
      "FREQ=DAILY;COUNT=5",
      dtstart,
      "UTC",
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-10T23:59:59.000Z")
    );
    expect(starts).toHaveLength(5);
    expect(starts[0]!.toISOString()).toBe("2026-07-01T09:00:00.000Z");
    expect(starts[4]!.toISOString()).toBe("2026-07-05T09:00:00.000Z");
  });
});

describe("expandEventOccurrences", () => {
  const master: CalendarEventMaster = {
    id: "evt1",
    title: "Standup",
    description: null,
    location: null,
    allDay: false,
    startsAt: new Date("2026-07-01T09:00:00.000Z"),
    endsAt: new Date("2026-07-01T09:30:00.000Z"),
    timezone: "UTC",
    rrule: "FREQ=DAILY;COUNT=5",
    rruleUntil: null,
    status: "confirmed",
  };

  it("expands and applies cancelled exception", () => {
    const occs = expandEventOccurrences(
      master,
      [
        {
          originalStartsAt: new Date("2026-07-02T09:00:00.000Z"),
          cancelled: true,
        },
      ],
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-10T23:59:59.000Z")
    );
    expect(occs).toHaveLength(4);
    expect(occs.find((o) => o.originalStartsAt.toISOString() === "2026-07-02T09:00:00.000Z")).toBeUndefined();
  });

  it("applies time override exception", () => {
    const occs = expandEventOccurrences(
      master,
      [
        {
          originalStartsAt: new Date("2026-07-03T09:00:00.000Z"),
          cancelled: false,
          startsAt: new Date("2026-07-03T11:00:00.000Z"),
          endsAt: new Date("2026-07-03T11:30:00.000Z"),
          title: "Moved standup",
        },
      ],
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-10T23:59:59.000Z")
    );
    const moved = occs.find((o) => o.originalStartsAt.toISOString() === "2026-07-03T09:00:00.000Z");
    expect(moved?.startsAt.toISOString()).toBe("2026-07-03T11:00:00.000Z");
    expect(moved?.title).toBe("Moved standup");
    expect(moved?.isException).toBe(true);
  });

  it("expands single non-recurring event", () => {
    const oneOff: CalendarEventMaster = { ...master, rrule: null };
    const occs = expandEventOccurrences(
      oneOff,
      [],
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-02T00:00:00.000Z")
    );
    expect(occs).toHaveLength(1);
    expect(occs[0]!.isRecurring).toBe(false);
  });
});

describe("computeDueReminders", () => {
  it("fires standalone absolute reminder once", () => {
    const dueAt = new Date("2026-07-01T08:00:00.000Z");
    const candidates = computeDueReminders({
      now: new Date("2026-07-01T09:00:00.000Z"),
      standalone: [
        {
          id: "r1",
          title: "Call mom",
          eventId: null,
          remindAt: dueAt,
          offsetMinutes: null,
          rrule: null,
          status: "active",
        },
      ],
      attached: [],
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.dedupeKey).toBe(`reminder:r1:${dueAt.toISOString()}`);
  });

  it("fires attached offset before occurrence", () => {
    const candidates = computeDueReminders({
      now: new Date("2026-07-01T08:50:00.000Z"),
      standalone: [],
      attached: [
        {
          reminder: {
            id: "r2",
            title: null,
            eventId: "evt1",
            remindAt: null,
            offsetMinutes: 15,
            rrule: null,
            status: "active",
          },
          occurrences: [
            {
              eventId: "evt1",
              originalStartsAt: new Date("2026-07-01T09:00:00.000Z"),
              startsAt: new Date("2026-07-01T09:00:00.000Z"),
              endsAt: new Date("2026-07-01T09:30:00.000Z"),
              title: "Meeting",
              description: null,
              location: null,
              allDay: false,
              isException: false,
              isRecurring: false,
              rrule: null,
            },
          ],
        },
      ],
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.dueAt.toISOString()).toBe("2026-07-01T08:45:00.000Z");
    expect(candidates[0]!.title).toBe("Meeting");
  });

  it("does not fire future reminders", () => {
    const candidates = computeDueReminders({
      now: new Date("2026-07-01T08:00:00.000Z"),
      standalone: [
        {
          id: "r3",
          title: "Later",
          eventId: null,
          remindAt: new Date("2026-07-01T10:00:00.000Z"),
          offsetMinutes: null,
          rrule: null,
          status: "active",
        },
      ],
      attached: [],
    });
    expect(candidates).toHaveLength(0);
  });
});
