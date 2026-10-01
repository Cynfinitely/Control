"use client";

import ActionForm, { type ConfirmOptions } from "@/components/ActionForm";
import type { FormAction as FormActionFn, ActionResult } from "@/lib/action-result";

type Props = {
  action: FormActionFn;
  successMessage?: string;
  resetOnSuccess?: boolean;
  confirm?: ConfirmOptions;
  className?: string;
  children: React.ReactNode;
};

/** Adapter for `(prev, formData)` actions built with `wrapFormAction`. */
export default function FormAction({
  action,
  successMessage = "Saved",
  resetOnSuccess = false,
  confirm,
  className,
  children,
}: Props) {
  return (
    <ActionForm
      action={(fd) => action(null, fd)}
      successMessage={successMessage}
      resetOnSuccess={resetOnSuccess}
      confirm={confirm}
      className={className}
    >
      {children}
    </ActionForm>
  );
}

export function FormErrorBanner({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return (
    <p
      role="alert"
      className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
    >
      {state.error}
    </p>
  );
}
