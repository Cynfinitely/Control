"use client";

import { useEffect, useId, useRef } from "react";
import Icon from "@/components/Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Small label above the title, e.g. "Page guide". */
  eyebrow?: string;
  children: React.ReactNode;
};

/**
 * Side panel for reading material: slides over the right edge on desktop and
 * fills the screen on phones. Built on the native <dialog> like Modal, so it
 * gets focus containment, Escape-to-close and an inert background, plus the
 * same focus restore and scroll lock.
 */
export default function SlideOver({ open, onClose, title, eyebrow, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLElement>("[data-slideover-close]")?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      if (dialog.open) dialog.close();
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCloseRef.current();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes.
        if (e.target === ref.current) onCloseRef.current();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-md overflow-visible bg-transparent p-0 text-slate-800 dark:text-slate-100"
    >
      <div className="flex h-full flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
            <h2 id={titleId} className="section-title">
              {title}
            </h2>
          </div>
          <button type="button" data-slideover-close onClick={onClose} className="btn-icon -mr-2 -mt-1" aria-label="Close guide">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  );
}
