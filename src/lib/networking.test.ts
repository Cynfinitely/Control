import { describe, expect, it } from "vitest";
import {
  parseTopics,
  serializeTopics,
  isOverdue,
  countOverdueContacts,
  rangeForNetworkingPeriod,
  buildNetworkingInsights,
  DEFAULT_CADENCE_DAYS,
} from "./networking";

const now = new Date("2026-08-25T12:00:00");

describe("parseTopics / serializeTopics", () => {
  it("returns empty array for blank input", () => {
    expect(parseTopics(null)).toEqual([]);
    expect(parseTopics(undefined)).toEqual([]);
    expect(parseTopics("")).toEqual([]);
    expect(parseTopics("  ,  ")).toEqual([]);
  });

  it("splits, trims, and drops duplicate chips case-insensitively", () => {
    expect(parseTopics("health, kids, health")).toEqual(["health", "kids"]);
    expect(parseTopics("Health, HEALTH, kids")).toEqual(["Health", "kids"]);
  });

  it("serializes chips to comma-separated text and round-trips", () => {
    expect(serializeTopics([])).toBeNull();
    expect(serializeTopics(["health", "kids"])).toBe("health, kids");
    expect(parseTopics(serializeTopics(["health", "kids"]))).toEqual(["health", "kids"]);
  });
});

describe("isOverdue", () => {
  it("treats never-contacted people as overdue", () => {
    expect(isOverdue(null, 30, now)).toBe(true);
  });

  it("uses a 30-day default cadence", () => {
    expect(DEFAULT_CADENCE_DAYS).toBe(30);
    expect(isOverdue(new Date("2026-08-01T10:00:00"), null, now)).toBe(false);
    expect(isOverdue(new Date("2026-07-20T10:00:00"), null, now)).toBe(true);
  });

  it("compares last touch against the contact cadence", () => {
    expect(isOverdue(new Date("2026-08-20T10:00:00"), 7, now)).toBe(false);
    expect(isOverdue(new Date("2026-08-10T10:00:00"), 7, now)).toBe(true);
  });
});

describe("countOverdueContacts", () => {
  it("counts people whose last touch is older than cadence", () => {
    const n = countOverdueContacts(
      [
        { lastTouch: new Date("2026-08-20T10:00:00"), touchCadenceDays: 7 },
        { lastTouch: new Date("2026-07-01T10:00:00"), touchCadenceDays: 30 },
        { lastTouch: null, touchCadenceDays: null },
      ],
      now
    );
    expect(n).toBe(2);
  });
});

describe("rangeForNetworkingPeriod", () => {
  it("returns week, month, and rolling 90-day windows", () => {
    const week = rangeForNetworkingPeriod("weekly", now);
    expect(week.from.getFullYear()).toBe(2026);
    expect(week.from.getMonth()).toBe(7);
    expect(week.from.getDate()).toBe(24);
    expect(week.to.getDate()).toBe(30);

    const month = rangeForNetworkingPeriod("monthly", now);
    expect(month.from.getDate()).toBe(1);
    expect(month.from.getMonth()).toBe(7);

    const rolling = rangeForNetworkingPeriod("90d", now);
    expect(rolling.from.getFullYear()).toBe(2026);
    expect(rolling.from.getMonth()).toBe(4);
    expect(rolling.from.getDate()).toBe(28);
  });
});

describe("buildNetworkingInsights", () => {
  const contacts = [
    { id: "mom", name: "Mother", relationship: "family", touchCadenceDays: 7, lastTouch: new Date("2026-08-20") },
    { id: "boss", name: "Boss", relationship: "professional", touchCadenceDays: 30, lastTouch: new Date("2026-07-01") },
    { id: "pal", name: "Friend", relationship: "friend", touchCadenceDays: null, lastTouch: new Date("2026-08-24") },
    { id: "new", name: "New", relationship: "other", touchCadenceDays: null, lastTouch: null },
  ];

  const interactions = [
    { id: "1", contactId: "mom", type: "call", topics: "health, kids", summary: "checkup", date: new Date("2026-08-20") },
    { id: "2", contactId: "mom", type: "call", topics: "health", summary: null, date: new Date("2026-08-10") },
    { id: "3", contactId: "pal", type: "message", topics: "travel", summary: null, date: new Date("2026-08-24") },
    { id: "4", contactId: "boss", type: "meeting", topics: "work", summary: null, date: new Date("2026-07-01") },
  ];

  it("rolls up period stats, mix, overdue people, and topic trends", () => {
    const range = rangeForNetworkingPeriod("monthly", now);
    const insights = buildNetworkingInsights(contacts, interactions, range, now);

    expect(insights.touches).toBe(3);
    expect(insights.calls).toBe(2);
    expect(insights.uniquePeople).toBe(2);

    expect(insights.typeMix.find((t) => t.type === "call")?.count).toBe(2);
    expect(insights.typeMix.find((t) => t.type === "message")?.count).toBe(1);
    expect(insights.typeMix.find((t) => t.type === "meeting")?.count).toBe(0);

    expect(insights.relationshipMix.find((r) => r.relationship === "family")?.count).toBe(2);
    expect(insights.relationshipMix.find((r) => r.relationship === "friend")?.count).toBe(1);

    expect(insights.overdue.map((c) => c.id).sort()).toEqual(["boss", "new"]);

    const health = insights.topics.find((t) => t.topic === "health");
    expect(health?.count).toBe(2);
    expect(health?.people).toEqual([{ id: "mom", name: "Mother", count: 2 }]);
    expect(insights.topics.find((t) => t.topic === "work")).toBeUndefined();

    const weekOfAug17 = insights.frequency.find((p) => p.weekStart === "2026-08-17");
    expect(weekOfAug17?.count).toBe(1);
  });
});
