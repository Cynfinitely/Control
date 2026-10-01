"use client";

import clsx from "clsx";
import Icon from "@/components/Icon";

type Props = {
  checked: boolean;
  onChange?: () => void;
  /** Accessible name, e.g. `Mark "Buy milk" done` */
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
  type?: "button" | "submit";
  name?: string;
  value?: string;
  className?: string;
};

/**
 * The app's single checkbox control: a 20–24px visible box with a 44px hit area
 * (via an invisible pseudo-element), exposed as role="checkbox".
 */
export default function CheckButton({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
  type = "button",
  name,
  value,
  className,
}: Props) {
  return (
    <button
      type={type}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      name={name}
      value={value}
      disabled={disabled}
      onClick={onChange}
      className={clsx(
        "relative inline-flex shrink-0 items-center justify-center rounded-md border-2 transition",
        "before:absolute before:-inset-2.5 before:content-['']",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" ? "h-6 w-6" : "h-5 w-5",
        checked
          ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
          : "border-slate-400 bg-white text-transparent hover:border-brand-500 dark:border-slate-500 dark:bg-slate-800",
        className
      )}
    >
      <Icon name="check" className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </button>
  );
}
