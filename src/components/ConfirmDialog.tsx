"use client";

import { useRef } from "react";
import clsx from "clsx";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      size="sm"
      role="alertdialog"
      hideClose
      // Destructive confirmations start on Cancel so a stray Enter never deletes.
      initialFocusRef={variant === "danger" ? cancelRef : confirmRef}
      footer={
        <>
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={clsx(variant === "danger" ? "btn-danger-solid" : "btn-primary")}
          >
            {pending && <Spinner />}
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}
