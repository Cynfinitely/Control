import { useId } from "react";
import clsx from "clsx";

type FieldProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type Props = {
  label: React.ReactNode;
  /** Render prop receiving the generated id plus aria wiring for hint/error. */
  children: (id: string, aria: FieldProps) => React.ReactNode;
  className?: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  /** Visually hide the label (still announced). */
  hideLabel?: boolean;
};

export default function FormField({ label, children, className, hint, error, required, hideLabel }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={clsx("label", hideLabel && "sr-only")}>
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children(id, { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
