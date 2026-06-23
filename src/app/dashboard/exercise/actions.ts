"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";

export async function createWorkout(formData: FormData) {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return;
  const workout = await prisma.workout.create({
    data: {
      userId,
      name,
      notes: optStr(formData.get("notes")),
      date: parseDate(formData.get("date")),
    },
  });
  revalidatePath("/dashboard/exercise");
  redirect(`/dashboard/exercise/${workout.id}`);
}

export async function deleteWorkout(formData: FormData) {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  await prisma.workout.updateMany({ where: { id, userId }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard/exercise");
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
  revalidatePath(`/dashboard/exercise/${workoutId}`);
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
  revalidatePath(`/dashboard/exercise/${workoutId}`);
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
  revalidatePath(`/dashboard/exercise/${workoutId}`);
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
  revalidatePath(`/dashboard/exercise/${workoutId}`);
}

export async function logWeight(formData: FormData) {
  const userId = await getUserId();
  const weightKg = num(formData.get("weightKg"));
  if (!weightKg) return;
  await prisma.bodyWeightLog.create({
    data: { userId, weightKg, date: parseDate(formData.get("date")) },
  });
  revalidatePath("/dashboard/exercise");
}

export async function logMeasurement(formData: FormData) {
  const userId = await getUserId();
  const label = str(formData.get("label"));
  const valueCm = num(formData.get("valueCm"));
  if (!label || !valueCm) return;
  await prisma.bodyMeasurement.create({
    data: { userId, label, valueCm, date: parseDate(formData.get("date")) },
  });
  revalidatePath("/dashboard/exercise");
}
