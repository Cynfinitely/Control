"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
};

export default function SubmitIconButton({ icon, disabled, className, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} className={className} {...props}>
      {pending ? <Spinner className="h-3.5 w-3.5" /> : icon}
    </button>
  );
}
