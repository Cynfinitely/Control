const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_BLOCK_DURATION_MINUTES = 720;

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

export function normalizeTimeInput(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return formatMinutesToTime(h * 60 + m);
}

/** Duration in minutes; treats end <= start as crossing midnight. */
export function blockDurationMinutes(startTime: string, endTime: string): number | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return null;
  if (end > start) return end - start;
  if (end === start) return null;
  return 24 * 60 - start + end;
}

export function crossesMidnight(startTime: string, endTime: string): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return false;
  return end <= start;
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  const duration = blockDurationMinutes(startTime, endTime);
  if (duration === null) return false;
  return duration >= 1 && duration <= MAX_BLOCK_DURATION_MINUTES;
}

export function compareTime(a: string, b: string): number {
  return (parseTimeToMinutes(a) ?? 0) - (parseTimeToMinutes(b) ?? 0);
}

export function getCurrentTimeMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

function endMinutesOnTimeline(startTime: string, endTime: string): number | null {
  const start = parseTimeToMinutes(startTime);
  const duration = blockDurationMinutes(startTime, endTime);
  if (start === null || duration === null) return null;
  return start + duration;
}

export function isBlockActive(startTime: string, endTime: string, now = new Date()): boolean {
  const current = getCurrentTimeMinutes(now);
  const start = parseTimeToMinutes(startTime);
  const endOnTimeline = endMinutesOnTimeline(startTime, endTime);
  if (start === null || endOnTimeline === null) return false;

  if (crossesMidnight(startTime, endTime)) {
    return current >= start || current < (parseTimeToMinutes(endTime) ?? -1);
  }
  return current >= start && current < endOnTimeline;
}

export function isBlockOverdue(startTime: string, endTime: string, status: string, now = new Date()): boolean {
  if (status !== "planned") return false;
  const current = getCurrentTimeMinutes(now);
  const endOnTimeline = endMinutesOnTimeline(startTime, endTime);
  if (endOnTimeline === null) return false;

  if (crossesMidnight(startTime, endTime)) {
    const end = parseTimeToMinutes(endTime);
    if (end === null) return false;
    const start = parseTimeToMinutes(startTime) ?? 0;
    if (current >= start) return false;
    return current > end;
  }
  return current > endOnTimeline;
}

export function isBlockUpcoming(startTime: string, now = new Date()): boolean {
  const start = parseTimeToMinutes(startTime);
  if (start === null) return false;
  return start > getCurrentTimeMinutes(now);
}

export function timelineStartMinutes(startTime: string, dayOffset = 0): number | null {
  const start = parseTimeToMinutes(startTime);
  if (start === null) return null;
  return dayOffset * 24 * 60 + start;
}

export function timelineEndMinutes(startTime: string, endTime: string, dayOffset = 0): number | null {
  const start = timelineStartMinutes(startTime, dayOffset);
  const duration = blockDurationMinutes(startTime, endTime);
  if (start === null || duration === null) return null;
  return start + duration;
}
