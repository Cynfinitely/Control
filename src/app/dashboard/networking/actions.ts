"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { parseTopics, serializeTopics, INTERACTION_TYPES } from "@/lib/networking";
import { failure, success, wrapFormAction, type ActionResult } from "@/lib/action-result";
import { RELATIONSHIPS } from "@/lib/contacts";

function invalidateNetworking(userId: string, contactId?: string) {
  revalidateUserCache(userId, "dashboard", "networking", "plan");
  revalidatePath("/dashboard/networking");
  if (contactId) revalidatePath(`/dashboard/networking/${contactId}`);
}

function parseRelationship(value: FormDataEntryValue | null): string | null {
  const v = str(value);
  return v || null;
}

function parseInteractionType(value: FormDataEntryValue | null): string {
  const type = str(value) || "call";
  return INTERACTION_TYPES.includes(type as (typeof INTERACTION_TYPES)[number]) ? type : "call";
}

/** createContact also returns the new contact so the UI can offer "Log interaction". */
export type CreateContactResult = ActionResult & { contactId?: string; name?: string };

export async function createContact(formData: FormData): Promise<CreateContactResult> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return failure("Name is required");
  const created = await prisma.contact.create({
    data: {
      userId,
      name,
      relationship: parseRelationship(formData.get("relationship")) || "other",
      org: optStr(formData.get("org")),
      role: optStr(formData.get("role")),
      email: optStr(formData.get("email")),
      phone: optStr(formData.get("phone")),
      tags: optStr(formData.get("tags")),
      notes: optStr(formData.get("notes")),
      birthday: parseOptionalDate(formData.get("birthday")),
      touchCadenceDays: formData.get("touchCadenceDays")
        ? parseInt(str(formData.get("touchCadenceDays")), 10) || null
        : null,
    },
  });
  invalidateNetworking(userId);
  // No message: the form shows its own toast with a "Log interaction" action.
  return { ok: true, contactId: created.id, name: created.name };
}

export async function updateContact(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!str(formData.get("name"))) return failure("Name is required");
  await prisma.contact.updateMany({
    where: { id, userId },
    data: {
      name: str(formData.get("name")),
      relationship: parseRelationship(formData.get("relationship")),
      org: optStr(formData.get("org")),
      role: optStr(formData.get("role")),
      email: optStr(formData.get("email")),
      phone: optStr(formData.get("phone")),
      tags: optStr(formData.get("tags")),
      notes: optStr(formData.get("notes")),
      birthday: parseOptionalDate(formData.get("birthday")),
      touchCadenceDays: formData.get("touchCadenceDays")
        ? parseInt(str(formData.get("touchCadenceDays")), 10) || null
        : null,
    },
  });
  invalidateNetworking(userId, id);
  return success("Saved");
}

export async function deleteContact(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.contact.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidateNetworking(userId);
  redirect("/dashboard/networking?tab=people");
}

async function logTouch(formData: FormData) {
  const userId = await getUserId();
  let contactId = str(formData.get("contactId"));
  const name = str(formData.get("name"));

  if (!contactId && name) {
    const rel = str(formData.get("relationship"));
    const relationship = RELATIONSHIPS.includes(rel as (typeof RELATIONSHIPS)[number]) ? rel : "other";
    const created = await prisma.contact.create({
      data: { userId, name, relationship },
    });
    contactId = created.id;
  }

  if (!contactId) return failure("Pick a person");

  const owns = await prisma.contact.findFirst({
    where: { id: contactId, userId, deletedAt: null },
  });
  if (!owns) return failure("Person not found");

  await prisma.interaction.create({
    data: {
      userId,
      contactId,
      type: parseInteractionType(formData.get("type")),
      summary: optStr(formData.get("summary")),
      topics: serializeTopics(parseTopics(str(formData.get("topics")))),
      date: parseDate(formData.get("date")),
    },
  });

  invalidateNetworking(userId, contactId);
  return success("Logged");
}

export const logTouchForm = wrapFormAction(logTouch, "Logged");

export async function deleteInteraction(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const contactId = str(formData.get("contactId"));
  const res = await prisma.interaction.deleteMany({ where: { id, userId, contactId } });
  if (res.count === 0) return failure("Log not found");
  invalidateNetworking(userId, contactId);
  return success("Log deleted");
}
