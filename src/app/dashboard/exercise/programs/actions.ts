"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUserId, str, optStr, num } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { success, failure, wrapFormAction, type ActionResult } from "@/lib/action-result";
import { parseProgramText } from "@/lib/exercise/parse-program-text";

function invalidateProgram(userId: string, programId?: string) {
  revalidateUserCache(userId, "dashboard", "exercise");
  revalidatePath("/dashboard/exercise");
  revalidatePath("/dashboard/exercise/programs/new");
  if (programId) revalidatePath(`/dashboard/exercise/programs/${programId}`);
}

function parsePositiveInt(value: FormDataEntryValue | null, fallback?: number): number | null {
  if (value === null || String(value).trim() === "") {
    return fallback ?? null;
  }
  const n = num(value);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

async function nextSortOrder(userId: string): Promise<number> {
  const max = await prisma.workoutProgram.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  return (max._max.sortOrder ?? 0) + 1;
}

export async function createProgram(formData: FormData): Promise<ActionResult | void> {
  const userId = await getUserId();
  const name = str(formData.get("name"));
  if (!name) return failure("Enter a program name.");
  const program = await prisma.workoutProgram.create({
    data: {
      userId,
      name,
      notes: optStr(formData.get("notes")),
      sortOrder: await nextSortOrder(userId),
    },
  });
  invalidateProgram(userId, program.id);
  redirect(`/dashboard/exercise/programs/${program.id}`);
}

export type ImportProgramFromTextResult =
  | { ok: true; programId: string; warnings: string[] }
  | { ok: false; error: string; warnings: string[] };

export async function importProgramFromText(formData: FormData): Promise<ImportProgramFromTextResult> {
  const userId = await getUserId();
  const parsed = parseProgramText(str(formData.get("text")));
  if (parsed.error || parsed.exercises.length === 0) {
    return { ok: false, error: parsed.error ?? "No exercises found in pasted text.", warnings: parsed.warnings };
  }

  const program = await prisma.workoutProgram.create({
    data: {
      userId,
      name: parsed.name,
      sortOrder: await nextSortOrder(userId),
      exercises: {
        create: parsed.exercises.map((ex, index) => ({
          name: ex.name,
          plannedSets: ex.plannedSets,
          plannedReps: ex.plannedReps,
          order: index,
        })),
      },
    },
  });
  invalidateProgram(userId, program.id);
  return { ok: true, programId: program.id, warnings: parsed.warnings };
}

export async function updateProgram(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!id) return failure("Invalid program");
  if (!name) return failure("Name is required");

  const result = await prisma.workoutProgram.updateMany({
    where: { id, userId },
    data: { name, notes: optStr(formData.get("notes")) },
  });
  if (result.count === 0) return failure("Program not found");
  invalidateProgram(userId, id);
  return success("Program updated");
}

export async function addProgramExercise(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const programId = str(formData.get("programId"));
  const name = str(formData.get("name"));
  if (!programId) return failure("Invalid program");
  if (!name) return failure("Exercise name is required");

  const plannedSets = parsePositiveInt(formData.get("plannedSets"), 3);
  if (plannedSets === null) return failure("Sets must be a positive whole number");
  const repsRaw = formData.get("plannedReps");
  const plannedReps =
    repsRaw === null || String(repsRaw).trim() === "" ? null : parsePositiveInt(repsRaw);
  if (repsRaw !== null && String(repsRaw).trim() !== "" && plannedReps === null) {
    return failure("Reps must be a positive whole number");
  }

  const owns = await prisma.workoutProgram.findFirst({ where: { id: programId, userId } });
  if (!owns) return failure("Program not found");

  const count = await prisma.workoutProgramExercise.count({ where: { programId } });
  await prisma.workoutProgramExercise.create({
    data: { programId, name, plannedSets, plannedReps, order: count },
  });
  invalidateProgram(userId, programId);
  return success("Exercise added");
}

export async function updateProgramExercise(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const programId = str(formData.get("programId"));
  const name = str(formData.get("name"));
  if (!id || !programId) return failure("Invalid exercise");
  if (!name) return failure("Exercise name is required");

  const plannedSets = parsePositiveInt(formData.get("plannedSets"));
  if (plannedSets === null) return failure("Sets must be a positive whole number");
  const repsRaw = formData.get("plannedReps");
  const plannedReps =
    repsRaw === null || String(repsRaw).trim() === "" ? null : parsePositiveInt(repsRaw);
  if (repsRaw !== null && String(repsRaw).trim() !== "" && plannedReps === null) {
    return failure("Reps must be a positive whole number");
  }

  const ex = await prisma.workoutProgramExercise.findFirst({
    where: { id, program: { userId, id: programId } },
  });
  if (!ex) return failure("Exercise not found");

  await prisma.workoutProgramExercise.update({
    where: { id },
    data: { name, plannedSets, plannedReps },
  });
  invalidateProgram(userId, programId);
  return success("Exercise updated");
}

export async function deleteProgramExercise(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const programId = str(formData.get("programId"));
  if (!id || !programId) return failure("Invalid exercise");

  const ex = await prisma.workoutProgramExercise.findFirst({
    where: { id, program: { userId, id: programId } },
  });
  if (!ex) return failure("Exercise not found");

  await prisma.workoutProgramExercise.delete({ where: { id } });
  invalidateProgram(userId, programId);
  return success("Exercise removed");
}

export async function reorderProgramExercise(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  const programId = str(formData.get("programId"));
  const direction = str(formData.get("direction"));
  if (!id || !programId) return failure("Invalid exercise");
  if (direction !== "up" && direction !== "down") return failure("Invalid direction");

  const owns = await prisma.workoutProgram.findFirst({ where: { id: programId, userId } });
  if (!owns) return failure("Program not found");

  const exercises = await prisma.workoutProgramExercise.findMany({
    where: { programId },
    orderBy: { order: "asc" },
  });
  const index = exercises.findIndex((ex) => ex.id === id);
  if (index < 0) return failure("Exercise not found");
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= exercises.length) {
    return failure(direction === "up" ? "Already first" : "Already last");
  }

  const current = exercises[index];
  const neighbor = exercises[swapWith];
  await prisma.$transaction([
    prisma.workoutProgramExercise.update({
      where: { id: current.id },
      data: { order: neighbor.order },
    }),
    prisma.workoutProgramExercise.update({
      where: { id: neighbor.id },
      data: { order: current.order },
    }),
  ]);
  invalidateProgram(userId, programId);
  return success(direction === "up" ? "Moved up" : "Moved down");
}

export async function archiveProgram(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid program");

  const result = await prisma.workoutProgram.updateMany({
    where: { id, userId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (result.count === 0) return failure("Program not found");
  invalidateProgram(userId, id);
  return success("Program archived");
}

export async function restoreProgram(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  const id = str(formData.get("id"));
  if (!id) return failure("Invalid program");

  const result = await prisma.workoutProgram.updateMany({
    where: { id, userId, archivedAt: { not: null } },
    data: { archivedAt: null },
  });
  if (result.count === 0) return failure("Program not found");
  invalidateProgram(userId, id);
  return success("Program restored");
}

export const updateProgramForm = wrapFormAction(updateProgram, "Program updated");
export const addProgramExerciseForm = wrapFormAction(addProgramExercise, "Exercise added");
export const updateProgramExerciseForm = wrapFormAction(updateProgramExercise, "Exercise updated");
