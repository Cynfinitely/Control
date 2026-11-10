"use client";

import { useId, useRef, useState } from "react";
import clsx from "clsx";
import Icon from "@/components/Icon";

export type PillOption = { value: string; label: string };

type Props = {
  label: string;
  options: readonly PillOption[];
  /** "" means nothing selected. */
  value: string;
  onChange: (value: string) => void;
  /** Hidden input name, so the picker posts with its form. */
  name?: string;
  /** Tap the active pill again to clear it. */
  clearable?: boolean;
  /** Adds a "+ New" pill that turns into a text field. */
  allowCustom?: boolean;
  customPlaceholder?: string;
  customMaxLength?: number;
  size?: "sm" | "md";
  /** Visually hide the label (it is still announced). */
  hideLabel?: boolean;
};

/**
 * Single-select pills (radio group). Arrow keys move between pills,
 * like native radios.
 */
export default function PillPicker({
  label,
  options,
  value,
  onChange,
  name,
  clearable = false,
  allowCustom = false,
  customPlaceholder = "New…",
  customMaxLength = 40,
  size = "md",
  hideLabel = false,
}: Props) {
  const labelId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // A custom value typed earlier shows as its own pill.
  const all =
    value && !options.some(o => o.value === value)
      ? [...options, { value, label: value }]
      : options;
  const activeIndex = all.findIndex(o => o.value === value);

  function select(next: string) {
    onChange(clearable && next === value ? "" : next);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + all.length) % all.length;
    onChange(all[next].value);
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>("[role=radio]")
      [next]?.focus();
  }

  function commitCustom() {
    const typed = draft.trim().toLowerCase().slice(0, customMaxLength);
    setAdding(false);
    setDraft("");
    if (typed) onChange(typed);
  }

  const pillClass = clsx(
    "chip",
    size === "sm" && "min-h-[32px] px-2.5 text-xs"
  );

  return (
    <div>
      <span
        id={labelId}
        className={hideLabel ? "sr-only" : "label mb-1.5 block"}
      >
        {label}
      </span>
      {name && <input type="hidden" name={name} value={value} />}
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex flex-wrap gap-1.5"
      >
        {all.map((opt, i) => {
          const active = opt.value === value;
          // Roving tab stop: the active pill, or the first when none is.
          const tabbable = active || (activeIndex === -1 && i === 0);
          return (
            <button
              key={opt.value || "__none"}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => select(opt.value)}
              onKeyDown={e => onKeyDown(e, i)}
              className={clsx(pillClass, active ? "chip-active" : "chip-idle")}
            >
              {active && <Icon name="check" className="h-3.5 w-3.5" />}
              {opt.label}
            </button>
          );
        })}
        {allowCustom &&
          (adding ? (
            <input
              autoFocus
              aria-label={`New ${label.toLowerCase()}`}
              value={draft}
              maxLength={customMaxLength}
              placeholder={customPlaceholder}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitCustom();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  setAdding(false);
                  setDraft("");
                }
              }}
              className={clsx(
                "input w-32 rounded-full py-1",
                size === "sm" ? "min-h-[32px] text-xs" : "min-h-[36px] text-sm"
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={clsx(
                pillClass,
                "border border-dashed border-slate-300 bg-transparent text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-slate-600 dark:text-slate-300 dark:hover:text-brand-300"
              )}
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              New
            </button>
          ))}
      </div>
    </div>
  );
}
