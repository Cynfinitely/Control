export const DEFAULT_PROGRAM_NAME = "Workout program";
export const DEFAULT_PLANNED_SETS = 3;

export type ParsedProgramExercise = {
  lineNumber: number;
  name: string;
  plannedSets: number;
  plannedReps: number | null;
};

export type ParseProgramTextResult = {
  name: string;
  exercises: ParsedProgramExercise[];
  warnings: string[];
  error?: string;
};

const SETS_RE =
  /^\s*(?:\d+[.)]\s+|\d+\s*[-–—]\s+)?(.+?)\s*[—–-]\s*(\d+)\s*sets?\b(?:\s*[x×]\s*(\d+))?\s*$/i;
const NXN_RE =
  /^\s*(?:\d+[.)]\s+|\d+\s*[-–—]\s+)?(.+?)\s+(\d+)\s*[x×]\s*(\d+)\s*$/i;
const NUMBERED_NAME_RE = /^\s*\d+[.)]\s+(.+?)\s*$/;

function parseExerciseLine(
  raw: string
): { name: string; plannedSets: number; plannedReps: number | null; missingSets: boolean } | null {
  const setsMatch = raw.match(SETS_RE);
  if (setsMatch) {
    const name = setsMatch[1].trim();
    if (!name) return null;
    return {
      name,
      plannedSets: Number(setsMatch[2]),
      plannedReps: setsMatch[3] ? Number(setsMatch[3]) : null,
      missingSets: false,
    };
  }

  const nxnMatch = raw.match(NXN_RE);
  if (nxnMatch) {
    const name = nxnMatch[1].trim();
    if (!name) return null;
    return {
      name,
      plannedSets: Number(nxnMatch[2]),
      plannedReps: Number(nxnMatch[3]),
      missingSets: false,
    };
  }

  const numbered = raw.match(NUMBERED_NAME_RE);
  if (numbered) {
    const name = numbered[1].trim();
    if (!name) return null;
    return {
      name,
      plannedSets: DEFAULT_PLANNED_SETS,
      plannedReps: null,
      missingSets: true,
    };
  }

  return null;
}

export function parseProgramText(text: string): ParseProgramTextResult {
  const warnings: string[] = [];
  const exercises: ParsedProgramExercise[] = [];
  let name: string | null = null;

  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const raw = lines[i];
    if (!raw.trim()) continue;

    const parsed = parseExerciseLine(raw);
    if (parsed) {
      if (parsed.missingSets) {
        warnings.push(`Line ${lineNumber}: no set count found, defaulting to ${DEFAULT_PLANNED_SETS} sets`);
      }
      exercises.push({
        lineNumber,
        name: parsed.name,
        plannedSets: parsed.plannedSets,
        plannedReps: parsed.plannedReps,
      });
      continue;
    }

    if (!name) {
      name = raw.trim();
      continue;
    }

    warnings.push(`Line ${lineNumber}: could not parse "${raw.trim()}"`);
  }

  const resolvedName = name?.trim() || DEFAULT_PROGRAM_NAME;

  if (exercises.length === 0) {
    return {
      name: resolvedName,
      exercises,
      warnings,
      error: text.trim() ? "No exercises found in pasted text." : "Paste a program to import.",
    };
  }

  return { name: resolvedName, exercises, warnings };
}
