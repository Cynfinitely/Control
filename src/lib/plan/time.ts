const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return false;
  return end > start;
}

export function compareTime(a: string, b: string): number {
  return (parseTimeToMinutes(a) ?? 0) - (parseTimeToMinutes(b) ?? 0);
}

export function getCurrentTimeMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function isBlockActive(startTime: string, endTime: string, now = new Date()): boolean {
  const current = getCurrentTimeMinutes(now);
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return false;
  return current >= start && current < end;
}

export function isBlockOverdue(startTime: string, endTime: string, status: string, now = new Date()): boolean {
  if (status !== "planned") return false;
  const end = parseTimeToMinutes(endTime);
  if (end === null) return false;
  return getCurrentTimeMinutes(now) > end;
}

export function isBlockUpcoming(startTime: string, now = new Date()): boolean {
  const start = parseTimeToMinutes(startTime);
  if (start === null) return false;
  return start > getCurrentTimeMinutes(now);
}
