"use client";

import ActionForm, { type ConfirmOptions } from "@/components/ActionForm";
import type { FormAction as FormActionFn } from "@/lib/action-result";

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
      action={fd => action(null, fd)}
      successMessage={successMessage}
      resetOnSuccess={resetOnSuccess}
      confirm={confirm}
      className={className}
    >
      {children}
    </ActionForm>
  );
}
