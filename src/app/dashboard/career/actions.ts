"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate, parseOptionalDate } from "@/lib/actions";

const path = "/dashboard/career";

export async function createCareerGoal(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  await prisma.careerGoal.create({
    data: {
      userId,
      title,
      description: optStr(formData.get("description")),
      targetDate: parseOptionalDate(formData.get("targetDate")),
    },
  });
  revalidatePath(path);
}

export async function setCareerGoalStatus(formData: FormData) {
  const userId = await getUserId();
  await prisma.careerGoal.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { status: str(formData.get("status")) },
  });
  revalidatePath(path);
}

export async function deleteCareerGoal(formData: FormData) {
  const userId = await getUserId();
  await prisma.careerGoal.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(path);
}

export async function createSkill(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.skill.create({
    data: {
      userId,
      name,
      level: Math.min(5, Math.max(1, num(formData.get("level"), 1))),
      notes: optStr(formData.get("notes")),
    },
  });
  revalidatePath(path);
}

export async function updateSkillLevel(formData: FormData) {
  const userId = await getUserId();
  await prisma.skill.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { level: Math.min(5, Math.max(1, num(formData.get("level"), 1))) },
  });
  revalidatePath(path);
}

export async function deleteSkill(formData: FormData) {
  const userId = await getUserId();
  await prisma.skill.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(path);
}

export async function createCertification(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  await prisma.certification.create({
    data: {
      userId,
      name,
      issuer: optStr(formData.get("issuer")),
      issuedAt: parseOptionalDate(formData.get("issuedAt")),
      expiresAt: parseOptionalDate(formData.get("expiresAt")),
      credentialId: optStr(formData.get("credentialId")),
    },
  });
  revalidatePath(path);
}

export async function deleteCertification(formData: FormData) {
  const userId = await getUserId();
  await prisma.certification.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(path);
}

export async function createWorkExperience(formData: FormData) {
  const userId = await getUserId();
  const company = str(formData.get("company"));
  const role = str(formData.get("role"));
  if (!company || !role) return;
  await prisma.workExperience.create({
    data: {
      userId,
      company,
      role,
      startDate: parseOptionalDate(formData.get("startDate")),
      endDate: parseOptionalDate(formData.get("endDate")),
      current: str(formData.get("current")) === "on",
      summary: optStr(formData.get("summary")),
    },
  });
  revalidatePath(path);
}

export async function deleteWorkExperience(formData: FormData) {
  const userId = await getUserId();
  await prisma.workExperience.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(path);
}

export async function createLearning(formData: FormData) {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return;
  await prisma.learningEntry.create({
    data: {
      userId,
      title,
      kind: str(formData.get("kind")) || "course",
      status: str(formData.get("status")) || "in_progress",
      hours: num(formData.get("hours")),
      skillName: optStr(formData.get("skillName")),
      notes: optStr(formData.get("notes")),
      date: parseDate(formData.get("date")),
    },
  });
  revalidatePath(path);
}

export async function deleteLearning(formData: FormData) {
  const userId = await getUserId();
  await prisma.learningEntry.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(path);
}
