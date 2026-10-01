"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { addDays, toDateInputValue } from "@/lib/date";
import Icon from "@/components/Icon";
import StepNavigator from "@/components/StepNavigator";

type Props = {
  basePath: string;
  dayValue: string;
  dayLabel: string;
  maxDay?: string;
  monthKey?: string;
  extraParams?: Record<string, string>;
  className?: string;
};

export default function DayNavigator({
  basePath,
  dayValue,
  dayLabel,
  maxDay,
  monthKey,
  extraParams,
  className,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const day = new Date(dayValue + "T00:00:00");
  const todayValue = toDateInputValue(new Date());
  const isToday = dayValue === todayValue;
  const prevDayValue = toDateInputValue(addDays(day, -1));
  const nextDayValue = toDateInputValue(addDays(day, 1));
  const canGoNext = !maxDay || nextDayValue <= maxDay;

  function buildUrl(nextDay: string) {
    const params = new URLSearchParams(extraParams);
    if (monthKey) params.set("month", monthKey);
    if (nextDay !== todayValue) params.set("day", nextDay);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  return (
    <StepNavigator
      className={className}
      label={dayLabel}
      sublabel={isToday && dayLabel !== "Today" ? "Today" : undefined}
      prev={{ href: buildUrl(prevDayValue), label: "Previous day" }}
      next={{ href: buildUrl(nextDayValue), label: "Next day", disabled: !canGoNext }}
      reset={isToday ? undefined : { href: buildUrl(todayValue), label: "Go to today", text: "Today" }}
    >
      <span className="relative">
        <button type="button" onClick={openPicker} className="btn-icon" aria-label="Jump to a date" title="Jump to a date">
          <Icon name="calendar" className="h-5 w-5" />
        </button>
        <input
          ref={inputRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={dayValue}
          max={maxDay}
          onChange={(e) => {
            if (e.target.value) router.push(buildUrl(e.target.value), { scroll: false });
          }}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      </span>
    </StepNavigator>
  );
}
