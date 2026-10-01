"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";

type Props = {
  /** Period / subject shown in the title, e.g. "September 2026" */
  subject: string;
  prompt: string;
  description: string;
  warning?: React.ReactNode;
  buttonClassName?: string;
};

/** Opens a dialog with a ready-to-copy AI analysis prompt. */
export default function AiPromptDialog({ subject, prompt, description, warning, buttonClassName }: Props) {
  const { success } = useToast();
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      success("Prompt copied to clipboard");
      setOpen(false);
    } catch {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName ?? "btn-ghost"}>
        <Icon name="sparkles" className="h-4 w-4" />
        AI prompt…
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`AI prompt for ${subject}`}
        description={description}
        size="lg"
        initialFocusRef={copyRef}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Close
            </button>
            <button ref={copyRef} type="button" onClick={copyPrompt} className="btn-primary">
              <Icon name="copy" className="h-4 w-4" />
              Copy prompt
            </button>
          </>
        }
      >
        {warning && (
          <p className="mb-3 flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </p>
        )}
        <textarea
          ref={textareaRef}
          readOnly
          value={prompt}
          className="input min-h-[260px] font-mono text-xs"
          spellCheck={false}
          aria-label="AI prompt text"
        />
      </Modal>
    </>
  );
}
