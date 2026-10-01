"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import Icon from "@/components/Icon";
import { deleteInspiration, updateInspiration } from "./actions";

type Props = {
  id: string;
  text: string;
  author: string | null;
};

function excerpt(text: string) {
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

export default function InspirationRow({ id, text, author }: Props) {
  const [editing, setEditing] = useState(false);
  const short = excerpt(text);

  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-3">
        <figure className="min-w-0 flex-1">
          <blockquote className="break-words text-slate-800 dark:text-slate-100">&ldquo;{text}&rdquo;</blockquote>
          {author && <figcaption className="mt-1.5 text-sm text-muted">— {author}</figcaption>}
        </figure>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="btn-icon"
            aria-expanded={editing}
            aria-controls={`inspiration-edit-${id}`}
            aria-label={editing ? `Close editor for “${short}”` : `Edit “${short}”`}
            title={editing ? "Close editor" : "Edit"}
          >
            <Icon name={editing ? "x" : "pencil"} className="h-4 w-4" />
          </button>
          <ActionForm
            action={deleteInspiration}
            confirm={{
              title: "Delete this inspiration?",
              message: `“${short}” will be removed from your library.`,
            }}
          >
            <input type="hidden" name="id" value={id} />
            <SubmitIconButton
              className="btn-icon-danger"
              icon={<Icon name="trash" className="h-4 w-4" />}
              aria-label={`Delete “${short}”`}
            />
          </ActionForm>
        </div>
      </div>

      {editing && (
        <ActionForm
          id={`inspiration-edit-${id}`}
          action={updateInspiration}
          onSuccess={() => setEditing(false)}
          className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-700"
        >
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
          <div className="flex flex-wrap gap-2">
            <SubmitButton className="btn-primary" pendingLabel="Saving…">
              Save changes
            </SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </ActionForm>
      )}
    </li>
  );
}
