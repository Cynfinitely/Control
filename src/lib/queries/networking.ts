import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { coerceDate } from "@/lib/date";
import {
  isOverdue,
  parseTopics,
  type InsightContact,
  type InsightInteraction,
} from "@/lib/networking";

export type ComposerContact = {
  id: string;
  name: string;
  relationship: string | null;
};

export type ActivityItem = {
  id: string;
  type: string;
  topics: string | null;
  summary: string | null;
  date: Date;
  contactId: string;
  contactName: string;
};

export type PersonRow = {
  id: string;
  name: string;
  relationship: string | null;
  org: string | null;
  role: string | null;
  tags: string | null;
  touchCadenceDays: number | null;
  lastTouch: Date | null;
  lastTouchType: string | null;
  lastCall: Date | null;
  overdue: boolean;
};

function networkingTags(userId: string) {
  return [cacheTag("networking", userId), cacheTag("dashboard", userId)];
}

function reviveActivity(row: {
  id: string;
  type: string;
  topics: string | null;
  summary: string | null;
  date: Date | string;
  contactId: string;
  contact: { name: string };
}): ActivityItem {
  return {
    id: row.id,
    type: row.type,
    topics: row.topics,
    summary: row.summary,
    date: coerceDate(row.date),
    contactId: row.contactId,
    contactName: row.contact.name,
  };
}

export async function getComposerContacts(userId: string): Promise<ComposerContact[]> {
  const rows = await cachedQuery(
    ["networking-composer-contacts", userId],
    networkingTags(userId),
    () =>
      prisma.contact.findMany({
        where: { userId, deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, relationship: true },
      })
  );
  return rows;
}

export async function getSuggestedTopics(userId: string): Promise<string[]> {
  const rows = await cachedQuery(
    ["networking-topics", userId],
    networkingTags(userId),
    () =>
      prisma.interaction.findMany({
        where: { userId, topics: { not: null } },
        select: { topics: true },
        take: 200,
        orderBy: { date: "desc" },
      })
  );
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const row of rows) {
    for (const topic of parseTopics(row.topics)) {
      const key = topic.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      topics.push(topic);
    }
  }
  return topics.sort((a, b) => a.localeCompare(b));
}

export async function getRecentActivity(userId: string, take = 40): Promise<ActivityItem[]> {
  const rows = await cachedQuery(
    ["networking-activity", userId, String(take)],
    networkingTags(userId),
    () =>
      prisma.interaction.findMany({
        where: { userId, contact: { deletedAt: null } },
        orderBy: { date: "desc" },
        take,
        select: {
          id: true,
          type: true,
          topics: true,
          summary: true,
          date: true,
          contactId: true,
          contact: { select: { name: true } },
        },
      })
  );
  return rows.map(reviveActivity);
}

export async function getPeopleRows(userId: string, now = new Date()): Promise<PersonRow[]> {
  const rows = await cachedQuery(
    ["networking-people", userId],
    networkingTags(userId),
    () =>
      prisma.contact.findMany({
        where: { userId, deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          interactions: { orderBy: { date: "desc" }, take: 10, select: { date: true, type: true } },
        },
      })
  );

  const people: PersonRow[] = rows.map((c) => {
    const last = c.interactions[0];
    const lastCall = c.interactions.find((i) => i.type === "call");
    const lastTouch = last ? coerceDate(last.date) : null;
    return {
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      org: c.org,
      role: c.role,
      tags: c.tags,
      touchCadenceDays: c.touchCadenceDays,
      lastTouch,
      lastTouchType: last?.type ?? null,
      lastCall: lastCall ? coerceDate(lastCall.date) : null,
      overdue: isOverdue(lastTouch, c.touchCadenceDays, now),
    };
  });

  people.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.lastTouch && b.lastTouch) {
      const delta = b.lastTouch.getTime() - a.lastTouch.getTime();
      if (delta !== 0) return delta;
    } else if (a.lastTouch || b.lastTouch) {
      return a.lastTouch ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  return people;
}

export async function getOverduePeople(userId: string, now = new Date(), take?: number): Promise<PersonRow[]> {
  const people = await getPeopleRows(userId, now);
  const overdue = people.filter((p) => p.overdue);
  return take ? overdue.slice(0, take) : overdue;
}

export async function getInsightsSource(
  userId: string,
  range: { from: Date; to: Date }
): Promise<{ contacts: InsightContact[]; interactions: InsightInteraction[] }> {
  const [contactRows, interactionRows] = await Promise.all([
    cachedQuery(
      ["networking-insight-contacts", userId],
      networkingTags(userId),
      () =>
        prisma.contact.findMany({
          where: { userId, deletedAt: null },
          select: {
            id: true,
            name: true,
            relationship: true,
            touchCadenceDays: true,
            interactions: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
          },
        })
    ),
    cachedQuery(
      ["networking-insight-interactions", userId, range.from.toISOString(), range.to.toISOString()],
      networkingTags(userId),
      () =>
        prisma.interaction.findMany({
          where: {
            userId,
            date: { gte: range.from, lte: range.to },
            contact: { deletedAt: null },
          },
          select: {
            id: true,
            contactId: true,
            type: true,
            topics: true,
            summary: true,
            date: true,
          },
        })
    ),
  ]);

  return {
    contacts: contactRows.map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      touchCadenceDays: c.touchCadenceDays,
      lastTouch: c.interactions[0] ? coerceDate(c.interactions[0].date) : null,
    })),
    interactions: interactionRows.map((it) => ({
      id: it.id,
      contactId: it.contactId,
      type: it.type,
      topics: it.topics,
      summary: it.summary,
      date: coerceDate(it.date),
    })),
  };
}
