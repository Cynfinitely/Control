"use client";

import { useState } from "react";
import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import Icon from "@/components/Icon";
import { MAX_TITLE_LENGTH } from "@/lib/todo-meta";
import { createTodo } from "./actions";
import PillPicker from "./PillPicker";
import {
  PRIORITY_OPTIONS,
  SLOT_OPTIONS,
  categoryOptions,
} from "./todo-options";

type Props = {
  dayValue: string;
  dayLabel: string;
  categories: string[];
};

/**
 * Title first, then pills for when/category/priority. Due date and
 * destination sit behind "More options" to keep the common case light.
 */
export default function TodoAddForm({ dayValue, dayLabel, categories }: Props) {
  // The slot is sticky between adds, so a run of after-work todos is quick.
  const [timeSlot, setTimeSlot] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");

  return (
    <ActionForm
      action={createTodo}
      successMessage="Todo added"
      resetOnSuccess
      onSuccess={() => {
        setCategory("");
        setPriority("medium");
      }}
      className="card mb-6 space-y-4"
    >
      <input type="hidden" name="dayDate" value={dayValue} />
      <div>
        <label htmlFor="todo-title" className="label">
          Todo
        </label>
        <div className="flex gap-2">
          <input
            id="todo-title"
            name="title"
            className="input min-w-0 flex-1"
            placeholder="Add a todo…"
            required
            maxLength={MAX_TITLE_LENGTH + 40}
            autoComplete="off"
            aria-describedby="todo-title-hint"
          />
          <SubmitButton className="btn-primary touch-target shrink-0 px-5">
            Add
          </SubmitButton>
        </div>
        <p id="todo-title-hint" className="mt-1.5 text-xs text-muted">
          Shortcuts: <kbd className="font-mono">#health</kbd> category,{" "}
          <kbd className="font-mono">!high</kbd> priority,{" "}
          <kbd className="font-mono">@after</kbd> or{" "}
          <kbd className="font-mono">@work</kbd> time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PillPicker
          label="When"
          name="timeSlot"
          options={SLOT_OPTIONS}
          value={timeSlot}
          onChange={setTimeSlot}
        />
        <PillPicker
          label="Priority"
          name="priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
      </div>

      <PillPicker
        label="Category"
        name="category"
        options={categoryOptions(categories)}
        value={category}
        onChange={setCategory}
        clearable
        allowCustom
        customPlaceholder="e.g. study"
      />

      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <Icon
            name="chevronRight"
            className="h-4 w-4 transition group-open:rotate-90"
          />
          More options
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="todo-due" className="label">
              Due date
            </label>
            <input
              id="todo-due"
              name="dueDate"
              type="date"
              className="input w-full"
            />
          </div>
          <div>
            <label htmlFor="todo-destination" className="label">
              Add to
            </label>
            <select
              id="todo-destination"
              name="destination"
              className="input w-full"
              defaultValue="day"
            >
              <option value="day">
                {dayLabel === "Today" ? "Today" : `This day (${dayLabel})`}
              </option>
              <option value="backlog">Backlog</option>
            </select>
          </div>
        </div>
      </details>
    </ActionForm>
  );
}
