import { inferKindFromTitle } from "@/lib/plan/infer-kind";
import type { PlanKind } from "@/lib/plan/kinds";
import {
  blockDurationMinutes,
  crossesMidnight,
  formatMinutesToTime,
  isValidTimeRange,
  normalizeTimeInput,
  parseTimeToMinutes,
} from "@/lib/plan/time";

export const DEFAULT_LAST_BLOCK_DURATION_MINUTES = 30;

const LINE_RE = /^\s*(\d{1,2}:\d{2})\s+(.+?)\s*$/;

export type ParsedPlanEntry = {
  lineNumber: number;
  startTime: string;
  endTime: string;
  title: string;
  kind: PlanKind;
  crossesMidnight?: boolean;
};

export type ParsePlanTextResult = {
  entries: ParsedPlanEntry[];
  warnings: string[];
};

type RawEntry = {
  lineNumber: number;
  startTime: string;
  title: string;
  sortMinutes: number;
};

function assignSortMinutes(entries: { startTime: string; sortMinutes: number }[]): void {
  let dayOffset = 0;
  let prevMinutes: number | null = null;

  for (const entry of entries) {
    const minutes = parseTimeToMinutes(entry.startTime);
    if (minutes === null) continue;

    if (prevMinutes !== null && minutes < prevMinutes) {
      dayOffset += 1;
    }

    entry.sortMinutes = dayOffset * 24 * 60 + minutes;
    prevMinutes = minutes;
  }
}

function computeEndTime(
  startTime: string,
  nextStartTime: string | null,
  defaultDurationMinutes: number
): { endTime: string; crossesMidnight: boolean } {
  if (nextStartTime) {
    const endTime = nextStartTime;
    return { endTime, crossesMidnight: crossesMidnight(startTime, endTime) };
  }

  const start = parseTimeToMinutes(startTime);
  if (start === null) {
    return { endTime: startTime, crossesMidnight: false };
  }

  const endTime = formatMinutesToTime(start + defaultDurationMinutes);
  return { endTime, crossesMidnight: crossesMidnight(startTime, endTime) };
}

export function parsePlanText(
  text: string,
  options?: { defaultLastBlockDurationMinutes?: number }
): ParsePlanTextResult {
  const defaultDuration = options?.defaultLastBlockDurationMinutes ?? DEFAULT_LAST_BLOCK_DURATION_MINUTES;
  const warnings: string[] = [];
  const raw: RawEntry[] = [];

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    if (!line.trim()) continue;

    const match = LINE_RE.exec(line);
    if (!match) {
      warnings.push(`Line ${lineNumber}: no time found — "${line.trim()}"`);
      continue;
    }

    const startTime = normalizeTimeInput(match[1]);
    if (!startTime) {
      warnings.push(`Line ${lineNumber}: invalid time — "${match[1]}"`);
      continue;
    }

    const title = match[2].trim();
    if (!title) {
      warnings.push(`Line ${lineNumber}: missing title`);
      continue;
    }

    raw.push({ lineNumber, startTime, title, sortMinutes: 0 });
  }

  assignSortMinutes(raw);
  raw.sort((a, b) => a.sortMinutes - b.sortMinutes);

  const entries: ParsedPlanEntry[] = [];

  for (let i = 0; i < raw.length; i++) {
    const current = raw[i];
    const next = raw[i + 1];
    const { endTime, crossesMidnight: overnight } = computeEndTime(
      current.startTime,
      next?.startTime ?? null,
      defaultDuration
    );

    if (!isValidTimeRange(current.startTime, endTime)) {
      warnings.push(
        `Line ${current.lineNumber}: invalid block duration (${current.startTime} – ${endTime})`
      );
      continue;
    }

    entries.push({
      lineNumber: current.lineNumber,
      startTime: current.startTime,
      endTime,
      title: current.title,
      kind: inferKindFromTitle(current.title),
      crossesMidnight: overnight,
    });
  }

  return { entries, warnings };
}

export function countParseableLines(text: string): number {
  return parsePlanText(text).entries.length;
}
