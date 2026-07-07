"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useToast } from "@/components/Toast";
import type { FormAction, ActionResult } from "@/lib/action-result";

type Props = {
  action: FormAction;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
};

export default function FormAction({
  action,
  successMessage = "Saved",
  className,
  children,
}: Props) {
  const { success, error } = useToast();
  const [state, formAction] = useFormState(action, null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      success(state.message ?? successMessage);
    } else {
      error(state.error);
    }
  }, [state, success, error, successMessage]);

  return (
    <form
      action={(fd) => startTransition(() => formAction(fd))}
      className={className}
    >
      {children}
    </form>
  );
}

export function FormErrorBanner({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return (
    <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
      {state.error}
    </p>
  );
}
