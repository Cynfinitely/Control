"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ConfirmDialog from "@/components/ConfirmDialog";

type Props = {
  onConfirm: () => void;
  title?: string;
  message?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
};

export default function DeleteConfirmButton({
  onConfirm,
  title = "Delete item?",
  message = "This action cannot be undone.",
  className = "touch-target shrink-0 text-slate-300 hover:text-red-500 disabled:opacity-50",
  label = "Delete",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={className}
        aria-label={label}
        title={label}
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel="Delete"
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
