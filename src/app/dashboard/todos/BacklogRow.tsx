"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import IconButton from "@/components/IconButton";
import { useToast } from "@/components/Toast";
import type { TodoItem } from "@/lib/queries/todos";
import {
  deleteTodo,
  pullFromBacklog,
  restoreTodo,
  updateTodo,
} from "./actions";
import { TodoBadges } from "./TodoRow";
import TodoEditForm, { patchFormData, type TodoPatch } from "./TodoEditForm";

type Props = {
  todo: TodoItem;
  dayValue: string;
  /** "today", "yesterday" or a formatted date — used in "Add to {day}". */
  dayName: string;
  categories: string[];
};

export default function BacklogRow({
  todo,
  dayValue,
  dayName,
  categories,
}: Props) {
  const { id, title } = todo;
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  function handleSave(patch: TodoPatch) {
    startTransition(async () => {
      const res = await updateTodo(patchFormData(id, patch)).catch(() => null);
      if (!res?.ok) {
        error(res && !res.ok ? res.error : "Couldn't save — try again");
        return;
      }
      setEditing(false);
      router.refresh();
      success("Todo updated");
    });
  }

  function handleDelete() {
    setHidden(true);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const res = await deleteTodo(fd).catch(() => null);
      if (!res?.ok) {
        setHidden(false);
        error(res && !res.ok ? res.error : "Couldn't delete — try again");
        return;
      }
      router.refresh();
      success("Backlog item deleted", {
        label: "Undo",
        onClick: () => {
          startTransition(async () => {
            const restoreFd = new FormData();
            restoreFd.set("id", id);
            const restored = await restoreTodo(restoreFd);
            setHidden(false);
            router.refresh();
            if (restored.ok) success("Todo restored");
            else error(restored.error);
          });
        },
      });
    });
  }

  if (hidden) return null;

  if (editing) {
    return (
      <li className="py-3">
        <TodoEditForm
          todo={todo}
          categories={categories}
          saving={pending}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="group flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <p
          onDoubleClick={() => setEditing(true)}
          title="Double-click to edit"
          className="break-words text-slate-800 dark:text-slate-100"
        >
          {title}
        </p>
        <TodoBadges todo={todo} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ActionForm action={pullFromBacklog}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="dayDate" value={dayValue} />
          <SubmitButton
            className="btn-ghost btn-sm min-h-[40px]"
            disabled={pending}
          >
            Add to {dayName}
          </SubmitButton>
        </ActionForm>
        <IconButton
          icon="pencil"
          disabled={pending}
          onClick={() => setEditing(true)}
          aria-label={`Edit “${title}”`}
        />
        <IconButton
          icon="trash"
          tone="danger"
          disabled={pending}
          onClick={handleDelete}
          aria-label={`Delete “${title}”`}
        />
      </div>
    </li>
  );
}
