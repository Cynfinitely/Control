"use client";

import { forwardRef, useState } from "react";
import Icon from "@/components/Icon";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/** Password field with a show/hide toggle. */
const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={visible ? "text" : "password"} className={className ?? "input pr-11"} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <Icon name={visible ? "eyeOff" : "eye"} className="h-4 w-4" />
      </button>
    </div>
  );
});

export default PasswordInput;
