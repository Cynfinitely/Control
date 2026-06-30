"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export default function SubmitButton({
  children,
  pendingLabel,
  disabled,
  className,
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} className={className} {...props}>
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
