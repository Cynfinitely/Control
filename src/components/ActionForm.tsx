"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { ActionResult } from "@/lib/action-result";

export type ServerFormAction = (formData: FormData) => Promise<ActionResult | void | unknown>;

export type ConfirmOptions = {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  variant?: "danger" | "default";
};

type Props = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: ServerFormAction;
  /** Ask before submitting. Use for every destructive action. */
  confirm?: ConfirmOptions;
  /** Toast shown on success when the action doesn't return its own message. `false` = no toast. */
  successMessage?: string | false;
  resetOnSuccess?: boolean;
  onSuccess?: (result: ActionResult | void) => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
};

function isActionResult(value: unknown): value is ActionResult {
  return typeof value === "object" && value !== null && "ok" in value;
}

/** Next.js signals redirect()/notFound() by throwing; never swallow those. */
function isNavigationError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

/**
 * Form wrapper for server actions that gives consistent feedback:
 * success/error toast, optional confirmation for destructive actions,
 * optional reset. SubmitButton pending states keep working (useFormStatus).
 */
export default function ActionForm({
  action,
  confirm,
  successMessage,
  resetOnSuccess = false,
  onSuccess,
  onError,
  children,
  ...formProps
}: Props) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const submitterRef = useRef<HTMLElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run(formData: FormData) {
    let result: unknown;
    try {
      result = await action(formData);
    } catch (err) {
      if (isNavigationError(err)) throw err;
      const message = "Something went wrong. Please try again.";
      toast.error(message);
      onError?.(message);
      return;
    }

    if (isActionResult(result) && !result.ok) {
      toast.error(result.error);
      onError?.(result.error);
      return;
    }

    const message = (isActionResult(result) && result.ok && result.message) || successMessage;
    if (message) toast.success(message);

    if (resetOnSuccess && formRef.current) {
      formRef.current.reset();
      formRef.current
        .querySelector<HTMLElement>("input:not([type=hidden]):not([type=submit]), textarea")
        ?.focus();
    }
    onSuccess?.(isActionResult(result) ? result : undefined);
  }

  return (
    <>
      <form
        {...formProps}
        ref={formRef}
        action={run}
        onSubmit={(e) => {
          if (!confirm || confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          e.preventDefault();
          submitterRef.current = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          setConfirmOpen(true);
        }}
      >
        {children}
      </form>
      {confirm && (
        <ConfirmDialog
          open={confirmOpen}
          title={confirm.title}
          message={confirm.message ?? "This can't be undone."}
          confirmLabel={confirm.confirmLabel ?? "Delete"}
          variant={confirm.variant ?? "danger"}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            confirmedRef.current = true;
            const submitter = submitterRef.current;
            formRef.current?.requestSubmit(
              submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
                ? submitter
                : undefined
            );
          }}
        />
      )}
    </>
  );
}
