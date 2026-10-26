"use client";

import { useEffect } from "react";

/** Save / Cancel strip for unsaved custom-order changes. */
export default function OrderSaveBar({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  // Mounted only while there are unsaved changes: ask before reload or close.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return (
    <div className="card sticky top-2 z-20 mb-3 flex flex-wrap items-center justify-between gap-2 py-2 shadow-md">
      <p className="text-sm font-medium" aria-live="polite">
        Unsaved order changes
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost btn-sm"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save order"}
        </button>
      </div>
    </div>
  );
}
