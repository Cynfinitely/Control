"use client";

import clsx from "clsx";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name, e.g. "Budget module". */
  label: string;
  disabled?: boolean;
  className?: string;
};

/**
 * On/off toggle exposed as role="switch". The visible track is small; the
 * invisible pseudo-element gives it a 44px hit area like CheckButton.
 */
export default function Switch({ checked, onChange, label, disabled, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "before:absolute before:-inset-2.5 before:content-['']",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
