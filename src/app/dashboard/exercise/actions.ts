"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { decrementLinkedGoals, incrementLinkedGoals } from "@/lib/goal-links";
import { getUserId, str, optStr, num, parseDate } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { toDateInputValue } from "@/lib/date";
import { success, failure, type ActionResult } from "@/lib/action-result";

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

/**
 * Start a gym session from a saved program: copies the program's exercises
 * (with planned sets/reps) into a new workout dated today, then opens it.
 */
export async function startWorkoutFromProgram(formData: FormData): Promise<ActionResult | void> {
  const userId = await getUserId();
  const programId = str(formData.get("programId"));
  if (!programId) return failure("Choose a program to start.");

  const program = await prisma.workoutProgram.findFirst({
    where: { id: programId, userId },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!program) return failure("Program not found.");
  if (program.exercises.length === 0) {
    return failure("Add at least one exercise to this program first.");
  }

  // Same date semantics as the gym form: a YYYY-MM-DD value through parseDate.
  const date = parseDate(formData.get("date") || toDateInputValue(new Date()));
  const workout = await prisma.workout.create({
    data: {
      userId,
      name: program.name,
      activityType: "gym",
      date,
      programId: program.id,
      exercises: {
        create: program.exercises.map((ex, index) => ({
          name: ex.name,
          order: index,
          plannedSets: ex.plannedSets,
          plannedReps: ex.plannedReps,
        })),
      },
    },
  });
  await incrementLinkedGoals(userId, "workout", workout.date);
  invalidateExercise(userId);
  redirect(`/dashboard/exercise/${workout.id}`);
}

const CARDIO_TYPES = new Set(["run", "swim", "walk", "other"]);

export async function createCardioWorkout(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const activityType = str(formData.get("activityType")) || "run";
  if (!CARDIO_TYPES.has(activityType)) return failure("Unknown activity type.");
  const date = parseDate(formData.get("date"));
  const durationMin = formData.get("durationMin") ? num(formData.get("durationMin")) : null;
  if (durationMin !== null && durationMin < 0) return failure("Duration can't be negative.");
  const notes = optStr(formData.get("notes"));

  let name = str(formData.get("name"));
  let distanceM: number | null = null;

  if (activityType === "run") {
    const km = num(formData.get("distanceKm"));
    if (km < 0) return failure("Distance can't be negative.");
    distanceM = km > 0 ? km * 1000 : null;
    if (!name) name = km > 0 ? `Run ${km} km` : "Run";
  } else if (activityType === "swim") {
    distanceM = num(formData.get("distanceM")) || null;
    if (distanceM !== null && distanceM < 0) return failure("Distance can't be negative.");
    if (!name) name = distanceM ? `Swim ${distanceM} m` : "Swim";
  } else if (activityType === "walk") {
    const km = num(formData.get("distanceKm"));
    if (km < 0) return failure("Distance can't be negative.");
    distanceM = km > 0 ? km * 1000 : null;
    const walkKind = str(formData.get("walkKind")) || "outdoor";
    const kindLabel = walkKind === "indoor" ? "Indoor" : "Outdoor";
    if (!name) {
      name = distanceM ? `${kindLabel} walk ${(distanceM / 1000).toFixed(1)} km` : `${kindLabel} walk`;
    }
    const walkNotes = [notes, walkKind ? `(${walkKind})` : null].filter(Boolean).join(" ");
    await prisma.workout.create({
      data: {
        userId,
        name,
        activityType,
        walkKind,
        date,
        durationMin,
        distanceM,
        notes: walkNotes || null,
      },
    });
    await incrementLinkedGoals(userId, "workout", date);
    invalidateExercise(userId);
    return success("Walk logged");
  } else {
    if (!name) name = str(formData.get("description"));
    if (!name) return failure("Enter what you did, e.g. Yoga.");
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
  return success(activityType === "run" ? "Run logged" : activityType === "swim" ? "Swim logged" : "Activity logged");
}

export async function deleteWorkout(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid workout.");
  const workout = await prisma.workout.findFirst({
    where: { id, userId, deletedAt: null },
    select: { date: true },
  });
  if (!workout) return failure("Workout not found.");
  const result = await prisma.workout.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return failure("Workout not found.");
  // Take the workout back off any goal that counted it.
  await decrementLinkedGoals(userId, "workout", workout.date);
  invalidateExercise(userId, id);
  return success("Workout deleted");
}

export async function addExercise(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const workoutId = str(formData.get("workoutId"));
  const name = str(formData.get("name"));
  if (!name) return failure("Enter an exercise name.");
  const owns = await prisma.workout.findFirst({ where: { id: workoutId, userId } });
  if (!owns) return failure("Workout not found.");
  const count = await prisma.workoutExercise.count({ where: { workoutId } });
  await prisma.workoutExercise.create({ data: { workoutId, name, order: count } });
  invalidateExercise(userId, workoutId);
  return success("Exercise added");
}

export async function deleteExercise(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const workoutId = str(formData.get("workoutId"));
  const ex = await prisma.workoutExercise.findFirst({
    where: { id, workout: { userId } },
  });
  if (!ex) return failure("Exercise not found.");
  await prisma.workoutExercise.delete({ where: { id } });
  invalidateExercise(userId, workoutId);
  return success("Exercise removed");
}

export async function addSet(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const workoutExerciseId = str(formData.get("workoutExerciseId"));
  const workoutId = str(formData.get("workoutId"));
  const ex = await prisma.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workout: { userId } },
  });
  if (!ex) return failure("Exercise not found.");
  const reps = formData.get("reps") ? num(formData.get("reps")) : null;
  const weightKg = formData.get("weightKg") ? num(formData.get("weightKg")) : null;
  const durationSec = formData.get("durationSec") ? num(formData.get("durationSec")) : null;
  if (reps === null && weightKg === null && durationSec === null) {
    return failure("Enter reps, weight or duration for the set.");
  }
  if ((reps ?? 0) < 0 || (weightKg ?? 0) < 0 || (durationSec ?? 0) < 0) {
    return failure("Set values can't be negative.");
  }
  const count = await prisma.exerciseSet.count({ where: { workoutExerciseId } });
  await prisma.exerciseSet.create({
    data: { workoutExerciseId, reps, weightKg, durationSec, order: count },
  });
  invalidateExercise(userId, workoutId);
  return success(`Set ${count + 1} added`);
}

export async function deleteSet(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const workoutId = str(formData.get("workoutId"));
  const set = await prisma.exerciseSet.findFirst({
    where: { id, workoutExercise: { workout: { userId } } },
  });
  if (!set) return failure("Set not found.");
  await prisma.exerciseSet.delete({ where: { id } });
  invalidateExercise(userId, workoutId);
  return success("Set deleted");
}

export async function logWeight(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const weightKg = num(formData.get("weightKg"));
  if (!(weightKg > 0)) return failure("Enter a weight above 0 kg.");
  await prisma.bodyWeightLog.create({
    data: { userId, weightKg, date: parseDate(formData.get("date")) },
  });
  invalidateExercise(userId);
  return success("Weight logged");
}

export async function logMeasurement(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const label = str(formData.get("label"));
  const valueCm = num(formData.get("valueCm"));
  if (!label) return failure("Enter what you measured, e.g. waist.");
  if (!(valueCm > 0)) return failure("Enter a measurement above 0 cm.");
  await prisma.bodyMeasurement.create({
    data: { userId, label, valueCm, date: parseDate(formData.get("date")) },
  });
  invalidateExercise(userId);
  return success("Measurement logged");
}

export async function deleteWeight(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.bodyWeightLog.deleteMany({ where: { id, userId } });
  if (result.count === 0) return failure("Entry not found.");
  invalidateExercise(userId);
  return success("Weight entry deleted");
}

export async function deleteMeasurement(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const result = await prisma.bodyMeasurement.deleteMany({ where: { id, userId } });
  if (result.count === 0) return failure("Entry not found.");
  invalidateExercise(userId);
  return success("Measurement deleted");
}
