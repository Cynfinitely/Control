"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { deleteInspiration, updateInspirationForm } from "./actions";

type Props = {
  id: string;
  text: string;
  author: string | null;
};

export default function InspirationRow({ id, text, author }: Props) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <blockquote className="text-slate-700 dark:text-slate-200">&ldquo;{text}&rdquo;</blockquote>
      {author && <p className="mt-2 text-sm text-slate-500">— {author}</p>}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-brand-600">Edit</summary>
        <FormAction action={updateInspirationForm} successMessage="Inspiration updated" className="mt-3 space-y-3">
          <input type="hidden" name="id" value={id} />
          <div>
            <label htmlFor={`inspiration-text-${id}`} className="label">
              Text
            </label>
            <textarea
              id={`inspiration-text-${id}`}
              name="text"
              className="input"
              rows={3}
              required
              defaultValue={text}
            />
          </div>
          <div>
            <label htmlFor={`inspiration-author-${id}`} className="label">
              Author (optional)
            </label>
            <input
              id={`inspiration-author-${id}`}
              name="author"
              className="input"
              placeholder="e.g. Seneca, or yourself"
              defaultValue={author ?? ""}
            />
          </div>
          <SubmitButton className="btn-primary">Save changes</SubmitButton>
        </FormAction>
      </details>
      <div className="mt-2">
        <DeleteConfirmButton
          title="Delete inspiration?"
          message="This quote or note will be removed from your library."
          label="Delete inspiration"
          className="text-xs text-slate-400 hover:text-red-500"
          onConfirm={() => {
            startTransition(async () => {
              const fd = new FormData();
              fd.set("id", id);
              await deleteInspiration(fd);
              router.refresh();
            });
          }}
        />
      </div>
    </div>
  );
}
