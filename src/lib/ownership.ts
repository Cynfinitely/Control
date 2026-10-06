import { prisma } from "@/lib/db";

/**
 * Ownership checks for record ids that arrive from the browser. Every id that
 * gets stored as a reference to another row must pass through here first, so a
 * user can never link to (and then read through) someone else's record.
 */

/** Link targets used by plan blocks and work focus items (`linkType` / `linkId`). */
export type OwnedLinkType = "career_goal" | "skill" | "todo" | "followup" | "meal";

const LINK_LOOKUPS: Record<OwnedLinkType, (id: string, userId: string) => Promise<{ id: string } | null>> = {
  career_goal: (id, userId) =>
    prisma.careerGoal.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } }),
  skill: (id, userId) =>
    prisma.skill.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } }),
  todo: (id, userId) =>
    prisma.todo.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } }),
  followup: (id, userId) => prisma.followUp.findFirst({ where: { id, userId }, select: { id: true } }),
  meal: (id, userId) =>
    prisma.mealPlanItem.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } }),
};

function isOwnedLinkType(value: string): value is OwnedLinkType {
  return Object.prototype.hasOwnProperty.call(LINK_LOOKUPS, value);
}

/**
 * True when there is no link, or the link points at a row this user owns.
 * Unknown link types are rejected.
 */
export async function ownsLink(userId: string, linkType: string | null, linkId: string | null): Promise<boolean> {
  if (!linkType || !linkId) return true;
  if (!isOwnedLinkType(linkType)) return false;
  return Boolean(await LINK_LOOKUPS[linkType](linkId, userId));
}

/** Returns the id when the contact belongs to the user, otherwise null. */
export async function ownedContactId(userId: string, contactId: string | null): Promise<string | null> {
  if (!contactId) return null;
  const row = await prisma.contact.findFirst({
    where: { id: contactId, userId, deletedAt: null },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Returns the skill when it belongs to the user, otherwise null. */
export async function ownedSkill(userId: string, skillId: string | null) {
  if (!skillId) return null;
  return prisma.skill.findFirst({
    where: { id: skillId, userId, deletedAt: null },
    select: { id: true, name: true },
  });
}

/** Returns the id when the calendar event belongs to the user, otherwise null. */
export async function ownedEventId(userId: string, eventId: string | null): Promise<string | null> {
  if (!eventId) return null;
  const row = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId, deletedAt: null },
    select: { id: true },
  });
  return row?.id ?? null;
}
