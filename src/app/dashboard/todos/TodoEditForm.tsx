"use client";

import { useId, useState } from "react";
import { toDateInputValue } from "@/lib/date";
import { MAX_TITLE_LENGTH, mergeCategories } from "@/lib/todo-meta";
import type { TodoItem } from "@/lib/queries/todos";
import PillPicker from "./PillPicker";
import {
  PRIORITY_OPTIONS,
  SLOT_OPTIONS,
  categoryOptions,
} from "./todo-options";

export type TodoPatch = {
  title: string;
  priority: string;
  category: string | null;
  timeSlot: string | null;
  /** yyyy-mm-dd, or "" for none. */
  dueDate: string;
};

export function patchFormData(id: string, patch: TodoPatch): FormData {
  const fd = new FormData();
  fd.set("id", id);
  fd.set("title", patch.title);
  fd.set("priority", patch.priority);
  fd.set("category", patch.category ?? "");
  fd.set("timeSlot", patch.timeSlot ?? "");
  fd.set("dueDate", patch.dueDate);
  return fd;
}

/** The fields of a TodoItem a patch changes, for optimistic updates. */
export function applyPatch(todo: TodoItem, patch: TodoPatch): TodoItem {
  return {
    ...todo,
    title: patch.title,
    priority: patch.priority,
    category: patch.category,
    timeSlot: patch.timeSlot,
    dueDate: patch.dueDate ? new Date(patch.dueDate + "T00:00:00") : null,
  };
}

type Props = {
  todo: TodoItem;
  categories: readonly string[];
  onSave: (patch: TodoPatch) => void;
  onCancel: () => void;
  saving?: boolean;
};

/** Inline editor shown in place of a row. Enter saves, Escape cancels. */
export default function TodoEditForm({
  todo,
  categories,
  onSave,
  onCancel,
  saving = false,
}: Props) {
  const id = useId();
  const [title, setTitle] = useState(todo.title);
  const [priority, setPriority] = useState(todo.priority);
  const [category, setCategory] = useState(todo.category ?? "");
  const [timeSlot, setTimeSlot] = useState(todo.timeSlot ?? "");
  const [dueDate, setDueDate] = useState(
    todo.dueDate ? toDateInputValue(todo.dueDate) : ""
  );
  const trimmed = title.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      priority,
      category: category || null,
      timeSlot: timeSlot || null,
      dueDate,
    });
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={e => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className="w-full space-y-3"
      aria-label={`Edit “${todo.title}”`}
    >
      <div>
        <label htmlFor={`${id}-title`} className="sr-only">
          Title
        </label>
        <input
          id={`${id}-title`}
          autoFocus
          onFocus={e => e.currentTarget.select()}
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          required
          autoComplete="off"
          className="input w-full font-medium"
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <PillPicker
          label="When"
          size="sm"
          options={SLOT_OPTIONS}
          value={timeSlot}
          onChange={setTimeSlot}
        />
        <PillPicker
          label="Priority"
          size="sm"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
      </div>
      <PillPicker
        label="Category"
        size="sm"
        options={categoryOptions(mergeCategories(categories))}
        value={category}
        onChange={setCategory}
        clearable
        allowCustom
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor={`${id}-due`} className="label">
            Due date
          </label>
          <input
            id={`${id}-due`}
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost btn-sm min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!trimmed || saving}
            className="btn-primary btn-sm min-h-[40px]"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
