import type { PlanKind } from "@/lib/plan/kinds";

const PRAYER_KEYWORDS = [
  "namaz",
  "namazi",
  "namazı",
  "sabah",
  "öğle",
  "ogle",
  "ikindi",
  "akşam",
  "aksam",
  "yatsı",
  "yatsi",
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
  "cevşen",
  "cevsen",
  "dua",
  "kaza",
  "qaza",
];

const WORKOUT_KEYWORDS = ["spor", "workout", "gym"];

const MEAL_KEYWORDS = ["öğün", "ogun", "yemek", "kahvaltı", "kahvalti", "breakfast", "lunch", "dinner"];

const BREAK_KEYWORDS = ["mola", "break", "uyku", "sleep", "alarm"];

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function inferKindFromTitle(title: string): PlanKind {
  const normalized = normalizeForMatch(title);

  if (PRAYER_KEYWORDS.some((k) => normalized.includes(normalizeForMatch(k)))) {
    return "prayer";
  }
  if (WORKOUT_KEYWORDS.some((k) => normalized.includes(k))) {
    return "workout";
  }
  if (MEAL_KEYWORDS.some((k) => normalized.includes(normalizeForMatch(k)))) {
    return "meal";
  }
  if (BREAK_KEYWORDS.some((k) => normalized.includes(k))) {
    return "break";
  }
  return "custom";
}
