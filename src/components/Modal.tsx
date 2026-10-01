"use client";

import { useEffect, useId, useRef } from "react";
import clsx from "clsx";
import Icon from "@/components/Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  role?: "dialog" | "alertdialog";
  /** Element to focus when opened. Defaults to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Hide the visible close (×) button — e.g. for confirmations with an explicit Cancel. */
  hideClose?: boolean;
  className?: string;
};

/**
 * Accessible modal built on the native <dialog> element:
 * showModal() gives focus containment, Escape-to-close and an inert background.
 * We add focus restore, scroll lock and labelled title/description.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  role = "dialog",
  initialFocusRef,
  hideClose = false,
  className,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const target =
      initialFocusRef?.current ??
      dialog.querySelector<HTMLElement>(
        "[data-autofocus], input:not([type=hidden]):not([disabled]), textarea, select, button:not([data-modal-close])"
      );
    target?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      if (dialog.open) dialog.close();
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCloseRef.current();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes.
        if (e.target === ref.current) onCloseRef.current();
      }}
      className={clsx(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-visible rounded-xl bg-transparent p-0 text-slate-800 dark:text-slate-100",
        size === "sm" && "max-w-md",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-2xl"
      )}
    >
      <div
        className={clsx(
          "flex max-h-[calc(100dvh-2rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="section-title">
              {title}
            </h2>
            {description && (
              <div id={descId} className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {description}
              </div>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              data-modal-close
              onClick={onClose}
              className="btn-icon -mr-2 -mt-2"
              aria-label="Close"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          )}
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-700 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
        {!children && !footer && <div className="pb-5" />}
      </div>
    </dialog>
  );
}
