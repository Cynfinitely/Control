"use client";

import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";

/** Copies the full registration link for an invite. */
export default function CopyCodeButton({ code, label }: { code: string; label: string }) {
  const toast = useToast();

  async function copy() {
    const link = `${window.location.origin}/register?invite=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy the link. Check clipboard permissions and try again.");
    }
  }

  return <IconButton icon="copy" onClick={copy} aria-label={`Copy invite link ${label}`} />;
}
