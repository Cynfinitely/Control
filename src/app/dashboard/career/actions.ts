"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate, parseOptionalDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { incrementLinkedGoals } from "@/lib/goal-links";
import { success, failure, type ActionResult } from "@/lib/action-result";

function invalidateCareer(userId: string) {
  revalidateUserCache(userId, "career", "dashboard");
  revalidatePath("/dashboard/career");
}

export async function createCareerGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return failure("Title is required");
  await prisma.careerGoal.create({
    data: {
      userId,
      title,
      description: optStr(formData.get("description")),
      targetDate: parseOptionalDate(formData.get("targetDate")),
    },
  });
  invalidateCareer(userId);
  return success("Goal added");
}

export async function setCareerGoalStatus(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const status = str(formData.get("status"));
  if (status !== "active" && status !== "completed") return failure("Invalid status");
  await prisma.careerGoal.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { status },
  });
  invalidateCareer(userId);
  return success(status === "completed" ? "Goal completed" : "Goal reopened");
}

export async function deleteCareerGoal(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.careerGoal.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  invalidateCareer(userId);
  return success("Goal deleted");
}

export async function createSkill(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return failure("Skill name is required");
  await prisma.skill.create({
    data: {
      userId,
      name,
      level: Math.min(5, Math.max(1, num(formData.get("level"), 1))),
      notes: optStr(formData.get("notes")),
    },
  });
  invalidateCareer(userId);
  return success("Skill added");
}

export async function updateSkillLevel(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.skill.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { level: Math.min(5, Math.max(1, num(formData.get("level"), 1))) },
  });
  invalidateCareer(userId);
  return success("Skill level updated");
}

export async function deleteSkill(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.skill.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  invalidateCareer(userId);
  return success("Skill deleted");
}

export async function createCertification(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return failure("Certification name is required");
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
  invalidateCareer(userId);
  return success("Certification added");
}

export async function deleteCertification(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.certification.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  invalidateCareer(userId);
  return success("Certification deleted");
}

export async function createWorkExperience(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const company = str(formData.get("company"));
  const role = str(formData.get("role"));
  if (!company || !role) return failure("Company and role are required");
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
  invalidateCareer(userId);
  return success("Experience added");
}

export async function deleteWorkExperience(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.workExperience.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  invalidateCareer(userId);
  return success("Experience deleted");
}

export async function createLearning(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const title = str(formData.get("title"));
  if (!title) return failure("Title is required");
  const skillId = optStr(formData.get("skillId"));
  let skillName = optStr(formData.get("skillName"));
  const date = parseDate(formData.get("date"));

  if (skillId) {
    const skill = await prisma.skill.findFirst({ where: { id: skillId, userId } });
    if (skill) skillName = skill.name;
  }

  await prisma.learningEntry.create({
    data: {
      userId,
      title,
      kind: str(formData.get("kind")) || "course",
      status: str(formData.get("status")) || "in_progress",
      hours: num(formData.get("hours")),
      skillId: skillId ?? null,
      skillName,
      notes: optStr(formData.get("notes")),
      date,
    },
  });

  await incrementLinkedGoals(userId, "learning", date, num(formData.get("hours")) || 1);
  invalidateCareer(userId);
  return success("Learning entry added");
}

export async function deleteLearning(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.learningEntry.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  invalidateCareer(userId);
  return success("Learning entry deleted");
}

export async function createJobApplication(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const company = str(formData.get("company"));
  const role = str(formData.get("role"));
  if (!company || !role) return failure("Company and role are required");
  await prisma.jobApplication.create({
    data: {
      userId,
      company,
      role,
      stage: str(formData.get("stage")) || "applied",
      contactId: optStr(formData.get("contactId")),
      dueDate: parseOptionalDate(formData.get("dueDate")),
      notes: optStr(formData.get("notes")),
    },
  });
  invalidateCareer(userId);
  return success("Application added");
}

export async function updateJobStage(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  if (!str(formData.get("stage"))) return failure("Choose a stage");
  await prisma.jobApplication.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { stage: str(formData.get("stage")) },
  });
  invalidateCareer(userId);
  return success("Stage updated");
}

export async function deleteJobApplication(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  await prisma.jobApplication.updateMany({
    where: { id: str(formData.get("id")), userId },
    data: { deletedAt: new Date() },
  });
  invalidateCareer(userId);
  return success("Application deleted");
}
