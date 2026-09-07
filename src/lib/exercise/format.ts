export function formatProgramExerciseLabel(ex: {
  name: string;
  plannedSets: number;
  plannedReps: number | null;
}): string {
  if (ex.plannedReps != null) return `${ex.name} — ${ex.plannedSets} × ${ex.plannedReps}`;
  return `${ex.name} — ${ex.plannedSets} sets`;
}
