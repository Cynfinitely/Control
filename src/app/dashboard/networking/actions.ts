"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";

function invalidateNetworking(userId: string, contactId?: string) {
  revalidateUserCache(userId, "dashboard", "networking", "plan");
  revalidatePath("/dashboard/networking");
  if (contactId) revalidatePath(`/dashboard/networking/${contactId}`);
}

function parseRelationship(value: FormDataEntryValue | null): string | null {
  const v = str(value);
  return v || null;
}

export async function createContact(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.contact.create({
    data: {
      userId,
      name,
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
  invalidateNetworking(userId);
}

export async function updateContact(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
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
}

export async function deleteContact(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.contact.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  invalidateNetworking(userId);
  redirect("/dashboard/networking");
}

export async function logInteraction(formData: FormData) {
  const userId = await getUserId();
  const contactId = str(formData.get("contactId"));
  const owns = await prisma.contact.findFirst({ where: { id: contactId, userId } });
  if (!owns) return;
  await prisma.interaction.create({
    data: {
      userId,
      contactId,
      type: str(formData.get("type")) || "message",
      summary: optStr(formData.get("summary")),
      date: parseDate(formData.get("date")),
    },
  });

  if (str(formData.get("scheduleFollowUp")) === "on") {
    const due = parseOptionalDate(formData.get("followUpDueDate"));
    await prisma.followUp.create({
      data: {
        userId,
        contactId,
        note: optStr(formData.get("followUpNote")) || "Follow up after interaction",
        dueDate: due,
      },
    });
  }

  invalidateNetworking(userId, contactId);
}

export async function logCallToday(formData: FormData) {
  const userId = await getUserId();
  const contactId = str(formData.get("contactId"));
  const owns = await prisma.contact.findFirst({ where: { id: contactId, userId } });
  if (!owns) return;
  await prisma.interaction.create({
    data: {
      userId,
      contactId,
      type: "call",
      summary: optStr(formData.get("summary")),
      date: new Date(),
    },
  });
  invalidateNetworking(userId, contactId);
}

export async function addFollowUp(formData: FormData) {
  const userId = await getUserId();
  const contactId = str(formData.get("contactId"));
  const note = str(formData.get("note"));
  if (!note) return;
  const owns = await prisma.contact.findFirst({ where: { id: contactId, userId } });
  if (!owns) return;
  await prisma.followUp.create({
    data: { userId, contactId, note, dueDate: parseOptionalDate(formData.get("dueDate")) },
  });
  invalidateNetworking(userId, contactId);
}

export async function toggleFollowUp(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const contactId = str(formData.get("contactId"));
  const toDone = await prisma.followUp.updateMany({
    where: { id, userId, done: false },
    data: { done: true },
  });
  if (toDone.count === 0) {
    await prisma.followUp.updateMany({
      where: { id, userId, done: true },
      data: { done: false },
    });
  }
  invalidateNetworking(userId, contactId || undefined);
}

export async function deleteInteraction(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const contactId = str(formData.get("contactId"));
  await prisma.interaction.deleteMany({ where: { id, userId, contactId } });
  invalidateNetworking(userId, contactId);
}
