"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { incrementLinkedGoals } from "@/lib/goal-links";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";

function invalidateExercise(userId: string, workoutId?: string) {
  revalidateUserCache(userId, "dashboard", "exercise");
  revalidatePath("/dashboard/exercise");
  if (workoutId) revalidatePath(`/dashboard/exercise/${workoutId}`);
}

export async function createGymWorkout(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name")) || "Gym session";
  const workout = await prisma.workout.create({
    data: {
      userId,
      name,
      activityType: "gym",
      notes: optStr(formData.get("notes")),
      date: parseDate(formData.get("date")),
    },
  });
  await incrementLinkedGoals(userId, "workout", workout.date);
  invalidateExercise(userId);
  redirect(`/dashboard/exercise/${workout.id}`);
}

export async function createCardioWorkout(formData: FormData) {
  const userId = await getUserId();
  const activityType = str(formData.get("activityType")) || "run";
  const date = parseDate(formData.get("date"));
  const durationMin = formData.get("durationMin") ? num(formData.get("durationMin")) : null;
  const notes = optStr(formData.get("notes"));

  let name = str(formData.get("name"));
  let distanceM: number | null = null;

  if (activityType === "run") {
    const km = num(formData.get("distanceKm"));
    distanceM = km > 0 ? km * 1000 : null;
    if (!name) name = km > 0 ? `Run ${km} km` : "Run";
  } else if (activityType === "swim") {
    distanceM = num(formData.get("distanceM")) || null;
    if (!name) name = distanceM ? `Swim ${distanceM} m` : "Swim";
  } else {
    if (!name) name = str(formData.get("description")) || "Other activity";
  }

  await prisma.workout.create({
    data: {
      userId,
      name,
      activityType,
      date,
      durationMin,
      distanceM,
      notes: notes ?? (activityType === "other" ? optStr(formData.get("description")) : null),
    },
  });
  await incrementLinkedGoals(userId, "workout", date);
  invalidateExercise(userId);
}

export async function deleteWorkout(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.workout.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  invalidateExercise(userId);
}

export async function addExercise(formData: FormData) {
  const userId = await getUserId();
  const workoutId = str(formData.get("workoutId"));
  const name = str(formData.get("name"));
  if (!name) return;
  const owns = await prisma.workout.findFirst({ where: { id: workoutId, userId } });
  if (!owns) return;
  const count = await prisma.workoutExercise.count({ where: { workoutId } });
  await prisma.workoutExercise.create({ data: { workoutId, name, order: count } });
  invalidateExercise(userId, workoutId);
}

export async function deleteExercise(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const workoutId = str(formData.get("workoutId"));
  const ex = await prisma.workoutExercise.findFirst({
    where: { id, workout: { userId } },
  });
  if (!ex) return;
  await prisma.workoutExercise.delete({ where: { id } });
  invalidateExercise(userId, workoutId);
}

export async function addSet(formData: FormData) {
  const userId = await getUserId();
  const workoutExerciseId = str(formData.get("workoutExerciseId"));
  const workoutId = str(formData.get("workoutId"));
  const ex = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workout: { userId } },
  });
  if (!ex) return;
  const count = await prisma.exerciseSet.count({ where: { workoutExerciseId } });
  await prisma.exerciseSet.create({
    data: {
      workoutExerciseId,
      reps: formData.get("reps") ? num(formData.get("reps")) : null,
      weightKg: formData.get("weightKg") ? num(formData.get("weightKg")) : null,
      durationSec: formData.get("durationSec") ? num(formData.get("durationSec")) : null,
      order: count,
    },
  });
  invalidateExercise(userId, workoutId);
}

export async function deleteSet(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const workoutId = str(formData.get("workoutId"));
  const set = await prisma.exerciseSet.findFirst({
    where: { id, workoutExercise: { workout: { userId } } },
  });
  if (!set) return;
  await prisma.exerciseSet.delete({ where: { id } });
  invalidateExercise(userId, workoutId);
}

export async function logWeight(formData: FormData) {
  const userId = await getUserId();
  const weightKg = num(formData.get("weightKg"));
  if (!weightKg) return;
  await prisma.bodyWeightLog.create({
    data: { userId, weightKg, date: parseDate(formData.get("date")) },
  });
  invalidateExercise(userId);
}

export async function logMeasurement(formData: FormData) {
  const userId = await getUserId();
  const label = str(formData.get("label"));
  const valueCm = num(formData.get("valueCm"));
  if (!label || !valueCm) return;
  await prisma.bodyMeasurement.create({
    data: { userId, label, valueCm, date: parseDate(formData.get("date")) },
  });
  invalidateExercise(userId);
}

export async function deleteWeight(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.bodyWeightLog.deleteMany({ where: { id, userId } });
  invalidateExercise(userId);
}

export async function deleteMeasurement(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.bodyMeasurement.deleteMany({ where: { id, userId } });
  invalidateExercise(userId);
}
