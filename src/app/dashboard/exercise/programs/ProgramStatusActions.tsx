"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { archiveProgram, restoreProgram } from "./actions";

export default function ProgramStatusActions({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (archived) {
    return (
      <button
        type="button"
        className="btn-ghost text-sm"
        onClick={() => {
          startTransition(async () => {
            const fd = new FormData();
            fd.set("id", id);
            await restoreProgram(fd);
            router.refresh();
          });
        }}
      >
        Restore
      </button>
    );
  }

  return (
    <DeleteConfirmButton
      title="Archive program?"
      message="This program will be hidden from your active list. You can restore it later."
      label="Archive"
      confirmLabel="Archive"
      className="btn-ghost text-sm text-slate-500 hover:text-red-500 dark:hover:text-red-400"
      onConfirm={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", id);
          await archiveProgram(fd);
          router.refresh();
        });
      }}
    />
  );
}
