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
  confirmLabel?: string;
  disabled?: boolean;
  /** "icon" = trash icon button (default); "text" = small labelled danger button */
  appearance?: "icon" | "text";
  icon?: string;
};

export default function DeleteConfirmButton({
  onConfirm,
  title = "Delete item?",
  message = "This can't be undone.",
  className,
  label = "Delete",
  confirmLabel = "Delete",
  disabled,
  appearance = "icon",
  icon = "trash",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={className ?? (appearance === "icon" ? "btn-icon-danger" : "btn-danger btn-sm")}
        aria-label={appearance === "icon" ? label : undefined}
        title={appearance === "icon" ? label : undefined}
      >
        <Icon name={icon} className="h-4 w-4" />
        {appearance === "text" && label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
