"use client";

import clsx from "clsx";
import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  icon: React.ReactNode;
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
};

export default function SubmitIconButton({ icon, disabled, className, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={clsx(className ?? "btn-icon")}
      title={props.title ?? props["aria-label"]}
      {...props}
    >
      {pending ? <Spinner className="h-4 w-4" /> : icon}
    </button>
  );
}
