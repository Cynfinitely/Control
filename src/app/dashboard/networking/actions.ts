"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, parseDate, parseOptionalDate } from "@/lib/actions";

export async function createContact(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.contact.create({
    data: {
      userId,
      name,
      org: optStr(formData.get("org")),
      role: optStr(formData.get("role")),
      email: optStr(formData.get("email")),
      phone: optStr(formData.get("phone")),
      tags: optStr(formData.get("tags")),
      notes: optStr(formData.get("notes")),
    },
  });
  revalidatePath("/dashboard/networking");
}

export async function deleteContact(formData: FormData) {
  const userId = await getUserId();
  await prisma.contact.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/networking");
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
  revalidatePath(`/dashboard/networking/${contactId}`);
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
  revalidatePath(`/dashboard/networking/${contactId}`);
  revalidatePath("/dashboard/networking");
}

export async function toggleFollowUp(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const fu = await prisma.followUp.findFirst({ where: { id, userId } });
  if (!fu) return;
  await prisma.followUp.update({ where: { id }, data: { done: !fu.done } });
  revalidatePath(`/dashboard/networking/${fu.contactId}`);
  revalidatePath("/dashboard/networking");
}
