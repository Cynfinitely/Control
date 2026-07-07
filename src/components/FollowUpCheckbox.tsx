"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { toggleFollowUp } from "@/app/dashboard/networking/actions";

type Props = {
  id: string;
  contactId: string;
};

export default function FollowUpCheckbox({ id, contactId }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("contactId", contactId);
    startTransition(async () => {
      await toggleFollowUp(fd);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="touch-target flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 hover:border-brand-500 disabled:opacity-50 dark:border-slate-600"
      aria-label="Mark follow-up done"
      title="Mark done"
    >
      <Icon name="check" className="h-3.5 w-3.5 text-brand-600 opacity-30" />
    </button>
  );
}
