import Link from "next/link";
import clsx from "clsx";
import Icon from "@/components/Icon";

type Step = { href?: string; onClick?: () => void; label: string; disabled?: boolean };

type Props = {
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  prev: Step;
  next: Step;
  /** "Today" / "This month" shortcut, shown only when not already there. */
  reset?: Step & { text: string };
  /** Extra control after the label (e.g. a date picker button). */
  children?: React.ReactNode;
  className?: string;
};

function StepButton({ step, icon }: { step: Step; icon: string }) {
  const className = clsx("btn-icon ring-1 ring-inset ring-slate-200 dark:ring-slate-700", step.disabled && "pointer-events-none opacity-40");
  if (step.href && !step.disabled) {
    return (
      <Link href={step.href} scroll={false} className={className} aria-label={step.label} title={step.label}>
        <Icon name={icon} className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={step.onClick}
      disabled={step.disabled}
      className={className}
      aria-label={step.label}
      title={step.label}
    >
      <Icon name={icon} className="h-5 w-5" />
    </button>
  );
}

/** Shared ‹ label › stepper used by the day, week and month navigators. */
export default function StepNavigator({ label, sublabel, prev, next, reset, children, className }: Props) {
  return (
    <div className={clsx("flex flex-wrap items-center gap-2", className)}>
      <StepButton step={prev} icon="chevronLeft" />
      <div className="min-w-[8rem] text-center sm:text-left">
        <p className="font-semibold text-slate-900 dark:text-slate-100" aria-live="polite">
          {label}
        </p>
        {sublabel && <p className="text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>}
      </div>
      <StepButton step={next} icon="chevronRight" />
      {children}
      {reset &&
        (reset.href ? (
          <Link href={reset.href} scroll={false} className="btn-ghost btn-sm min-h-[36px]">
            {reset.text}
          </Link>
        ) : (
          <button type="button" onClick={reset.onClick} className="btn-ghost btn-sm min-h-[36px]">
            {reset.text}
          </button>
        ))}
    </div>
  );
}
