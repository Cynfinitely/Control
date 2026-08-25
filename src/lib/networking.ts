import { addDays, endOfDay, rangeFor, startOfDay, startOfWeek, toDateInputValue } from "@/lib/date";
import { RELATIONSHIPS } from "@/lib/contacts";

export const DEFAULT_CADENCE_DAYS = 30;

export const INTERACTION_TYPES = ["call", "meeting", "message", "event"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_TYPE_LABELS: Record<string, string> = {
  call: "Call",
  meeting: "Meeting",
  message: "Message",
  event: "Event",
};

export type NetworkingPeriod = "weekly" | "monthly" | "90d";

export type ContactTouch = {
  lastTouch: Date | null;
  touchCadenceDays: number | null;
};

export type InsightContact = ContactTouch & {
  id: string;
  name: string;
  relationship: string | null;
};

export type InsightInteraction = {
  id: string;
  contactId: string;
  type: string;
  topics: string | null;
  summary: string | null;
  date: Date;
};

export type FrequencyPoint = { weekStart: string; count: number };
export type TypeMix = { type: string; count: number };
export type RelationshipMix = { relationship: string; count: number };
export type TopicPerson = { id: string; name: string; count: number };
export type TopicTrend = { topic: string; count: number; people: TopicPerson[] };
export type OverdueContact = {
  id: string;
  name: string;
  relationship: string | null;
  lastTouch: Date | null;
  cadenceDays: number;
};

export type NetworkingInsights = {
  touches: number;
  calls: number;
  uniquePeople: number;
  frequency: FrequencyPoint[];
  typeMix: TypeMix[];
  relationshipMix: RelationshipMix[];
  overdue: OverdueContact[];
  topics: TopicTrend[];
};

export function parseTopics(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const part of value.split(",")) {
    const topic = part.trim();
    if (!topic) continue;
    const key = topic.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    topics.push(topic);
  }
  return topics;
}

export function serializeTopics(topics: string[]): string | null {
  const unique = parseTopics(topics.join(","));
  return unique.length === 0 ? null : unique.join(", ");
}

export function isOverdue(
  lastTouch: Date | null | undefined,
  cadenceDays: number | null | undefined,
  now: Date
): boolean {
  if (!lastTouch) return true;
  const cadence = cadenceDays ?? DEFAULT_CADENCE_DAYS;
  const threshold = addDays(now, -cadence);
  return lastTouch < threshold;
}

export function countOverdueContacts(contacts: ContactTouch[], now: Date): number {
  return contacts.filter((c) => isOverdue(c.lastTouch, c.touchCadenceDays, now)).length;
}

export function rangeForNetworkingPeriod(period: NetworkingPeriod, ref = new Date()) {
  const at = new Date(ref);
  if (period === "90d") {
    return { from: addDays(startOfDay(new Date(at)), -89), to: endOfDay(new Date(at)) };
  }
  return rangeFor(period, at);
}

export function networkingHealth(overdueCount: number): "good" | "warn" | "bad" {
  if (overdueCount > 5) return "bad";
  if (overdueCount === 0) return "good";
  return "warn";
}

export function buildNetworkingInsights(
  contacts: InsightContact[],
  interactions: InsightInteraction[],
  range: { from: Date; to: Date },
  now: Date
): NetworkingInsights {
  const inPeriod = interactions.filter((it) => it.date >= range.from && it.date <= range.to);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  const typeCounts = new Map<string, number>(INTERACTION_TYPES.map((t) => [t, 0]));
  const relCounts = new Map<string, number>(RELATIONSHIPS.map((r) => [r, 0]));
  const unique = new Set<string>();
  const weekCounts = new Map<string, number>();

  let weekCursor = startOfWeek(range.from);
  const lastWeek = startOfWeek(range.to);
  while (weekCursor <= lastWeek) {
    weekCounts.set(toDateInputValue(weekCursor), 0);
    weekCursor = addDays(weekCursor, 7);
  }

  for (const it of inPeriod) {
    unique.add(it.contactId);
    typeCounts.set(it.type, (typeCounts.get(it.type) ?? 0) + 1);
    const rel = contactById.get(it.contactId)?.relationship ?? "other";
    const relKey = RELATIONSHIPS.includes(rel as (typeof RELATIONSHIPS)[number]) ? rel : "other";
    relCounts.set(relKey, (relCounts.get(relKey) ?? 0) + 1);
    const weekKey = toDateInputValue(startOfWeek(it.date));
    if (weekCounts.has(weekKey)) {
      weekCounts.set(weekKey, (weekCounts.get(weekKey) ?? 0) + 1);
    }
  }

  const topicMap = new Map<string, { topic: string; count: number; people: Map<string, number> }>();
  for (const it of inPeriod) {
    const contact = contactById.get(it.contactId);
    for (const topic of parseTopics(it.topics)) {
      const key = topic.toLowerCase();
      let entry = topicMap.get(key);
      if (!entry) {
        entry = { topic, count: 0, people: new Map() };
        topicMap.set(key, entry);
      }
      entry.count += 1;
      if (contact) {
        entry.people.set(contact.id, (entry.people.get(contact.id) ?? 0) + 1);
      }
    }
  }

  const topics: TopicTrend[] = [...topicMap.values()]
    .map((entry) => ({
      topic: entry.topic,
      count: entry.count,
      people: [...entry.people.entries()]
        .map(([id, count]) => ({
          id,
          name: contactById.get(id)?.name ?? id,
          count,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

  const overdue: OverdueContact[] = contacts
    .filter((c) => isOverdue(c.lastTouch, c.touchCadenceDays, now))
    .map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      lastTouch: c.lastTouch,
      cadenceDays: c.touchCadenceDays ?? DEFAULT_CADENCE_DAYS,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    touches: inPeriod.length,
    calls: inPeriod.filter((it) => it.type === "call").length,
    uniquePeople: unique.size,
    frequency: [...weekCounts.entries()].map(([weekStart, count]) => ({ weekStart, count })),
    typeMix: INTERACTION_TYPES.map((type) => ({ type, count: typeCounts.get(type) ?? 0 })),
    relationshipMix: RELATIONSHIPS.map((relationship) => ({
      relationship,
      count: relCounts.get(relationship) ?? 0,
    })),
    overdue,
    topics,
  };
}
