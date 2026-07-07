import { useId } from "react";

type Props = {
  label: string;
  children: (id: string) => React.ReactNode;
  className?: string;
  hint?: string;
};

export default function FormField({ label, children, className, hint }: Props) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
