"use client";

import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";

export default function CopyCodeButton({ code }: { code: string }) {
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Couldn't copy — select the code and copy it manually.");
    }
  }

  return <IconButton icon="copy" onClick={copy} aria-label={`Copy invite code ${code}`} />;
}
