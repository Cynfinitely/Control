export type PainBand = "mild" | "moderate" | "severe";

export type DurationPreset = {
  id: string;
  label: string;
  minutes: number;
};

export const DURATION_PRESETS: DurationPreset[] = [
  { id: "under_2h", label: "<2h", minutes: 90 },
  { id: "2_to_4h", label: "2–4h", minutes: 180 },
  { id: "4_to_12h", label: "4–12h", minutes: 480 },
  { id: "all_day", label: "All day", minutes: 1440 },
];

const TONE_BY_BAND: Record<PainBand, string> = {
  mild: "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100",
  moderate: "bg-orange-300 text-orange-950 dark:bg-orange-800 dark:text-orange-100",
  severe: "bg-rose-400 text-rose-950 dark:bg-rose-800 dark:text-rose-100",
};

export function painBand(pain: number): PainBand | null {
  if (pain < 1 || pain > 10) return null;
  if (pain <= 3) return "mild";
  if (pain <= 6) return "moderate";
  return "severe";
}

export function painToneClass(pain: number): string {
  const band = painBand(pain);
  return band ? TONE_BY_BAND[band] : "";
}

export function monthMigraineStats(logs: { pain: number }[]) {
  const migraineDays = logs.length;
  if (migraineDays === 0) {
    return { migraineDays: 0, averagePain: 0, severeDays: 0 };
  }
  const totalPain = logs.reduce((sum, log) => sum + log.pain, 0);
  const severeDays = logs.filter((log) => log.pain >= 7).length;
  return {
    migraineDays,
    averagePain: totalPain / migraineDays,
    severeDays,
  };
}
