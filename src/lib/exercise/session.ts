/** Pure helpers for logging a workout session (no Prisma / React). */

export const ACTIVITY_LABELS: Record<string, string> = {
  run: "Run",
  swim: "Swim",
  walk: "Walk",
  gym: "Gym",
  other: "Other",
};

export function activityLabel(activityType: string): string {
  return ACTIVITY_LABELS[activityType] ?? activityType;
}

type SetLike = { reps: number | null; weightKg: number | null; durationSec: number | null };

export type SetPrefill = { reps: string; weightKg: string; durationSec: string };

/**
 * Default values for the next set: repeat the previous set when there is one,
 * otherwise fall back to the planned reps copied from the program.
 */
export function nextSetPrefill(sets: readonly SetLike[], plannedReps: number | null | undefined): SetPrefill {
  const last = sets[sets.length - 1];
  const reps = last?.reps ?? plannedReps ?? null;
  return {
    reps: reps != null ? String(reps) : "",
    weightKg: last?.weightKg != null ? String(last.weightKg) : "",
    durationSec: last?.durationSec != null ? String(last.durationSec) : "",
  };
}

/** "3 × 10" or "3 sets"; null when nothing was planned. */
export function formatPlan(plannedSets: number | null | undefined, plannedReps: number | null | undefined): string | null {
  if (!plannedSets) return plannedReps ? `${plannedReps} reps` : null;
  if (plannedReps) return `${plannedSets} × ${plannedReps}`;
  return plannedSets === 1 ? "1 set" : `${plannedSets} sets`;
}

export type SetProgress = { done: number; planned: number; complete: boolean; label: string };

/** Progress toward the planned set count, or null when no sets were planned. */
export function setProgress(doneSets: number, plannedSets: number | null | undefined): SetProgress | null {
  if (!plannedSets) return null;
  return {
    done: doneSets,
    planned: plannedSets,
    complete: doneSets >= plannedSets,
    label: `${doneSets} of ${plannedSets} sets`,
  };
}

/** One-line summary for a logged workout, e.g. "5.0 km · 28 min". */
export function formatWorkoutSummary(w: {
  activityType: string;
  walkKind?: string | null;
  distanceM: number | null;
  durationMin: number | null;
  exerciseCount?: number;
}): string {
  const parts: string[] = [];
  if (w.activityType === "walk" && w.walkKind) {
    parts.push(w.walkKind === "indoor" ? "Indoor" : "Outdoor");
  }
  if (w.distanceM) parts.push(formatDistance(w.activityType, w.distanceM));
  if (w.durationMin) parts.push(`${w.durationMin} min`);
  if (w.activityType === "gym" && w.exerciseCount !== undefined) {
    parts.push(w.exerciseCount === 1 ? "1 exercise" : `${w.exerciseCount} exercises`);
  }
  return parts.join(" · ") || activityLabel(w.activityType);
}

export function formatDistance(activityType: string, distanceM: number): string {
  return activityType === "run" || activityType === "walk"
    ? `${(distanceM / 1000).toFixed(1)} km`
    : `${distanceM} m`;
}

/** Average pace for runs/walks ("5:36 /km"), or null when it can't be computed. */
export function formatPace(distanceM: number | null, durationMin: number | null): string | null {
  if (!distanceM || !durationMin || distanceM <= 0 || durationMin <= 0) return null;
  const secPerKm = Math.round((durationMin * 60) / (distanceM / 1000));
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}
