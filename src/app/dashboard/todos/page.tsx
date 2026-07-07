import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { toDateInputValue, addDays, formatDayLabel, parseDayParam } from "@/lib/date";
import { getBacklogTodos, getDayTodos } from "@/lib/queries/todos";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import FocusTarget from "@/components/FocusTarget";
import TodoList from "./TodoList";
import BacklogRow from "./BacklogRow";
import {
  createTodoForm,
  moveUnfinishedToBacklogForm,
} from "./actions";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const [dayTodos, backlog] = await Promise.all([
    getDayTodos(user.id, dayValue),
    getBacklogTodos(user.id),
  ]);

  return (
    <div>
      <PageHeader title="Todos" description="Simple daily checklist — add tasks, check them off." />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator basePath="/dashboard/todos" dayValue={dayValue} dayLabel={dayLabel} />
        {!searchParams.day && dayTodos.some((t) => t.status === "open") && (
          <FormAction action={moveUnfinishedToBacklogForm} successMessage="Moved to backlog">
            <input type="hidden" name="dayDate" value={toDateInputValue(addDays(day, -1))} />
            <SubmitButton className="btn-ghost text-xs">Move yesterday&apos;s open to backlog</SubmitButton>
          </FormAction>
        )}
      </div>

      <Suspense fallback={null}>
        <FocusTarget param="focus">
          <FormAction
            action={createTodoForm}
            successMessage="Todo added"
            className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input type="hidden" name="dayDate" value={dayValue} />
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="todo-title" className="sr-only">
                Todo title
              </label>
              <input
                id="todo-title"
                name="title"
                className="input w-full"
                placeholder="Add a todo for this day…"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="todo-priority" className="label">
                Priority
              </label>
              <select id="todo-priority" name="priority" className="input" defaultValue="medium">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="todo-category" className="label">
                Category
              </label>
              <input id="todo-category" name="category" className="input" placeholder="e.g. work, health" />
            </div>
            <div>
              <label htmlFor="todo-due" className="label">
                Due date
              </label>
              <input id="todo-due" name="dueDate" type="date" className="input" />
            </div>
            <div className="flex items-end">
              <SubmitButton className="btn-primary touch-target w-full">Add</SubmitButton>
            </div>
          </FormAction>
        </FocusTarget>
      </Suspense>

      <TodoList initialTodos={dayTodos} />

      {backlog.length > 0 && (
        <details className="card mt-8">
          <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-200">
            Backlog ({backlog.length})
          </summary>
          <p className="mt-2 text-xs text-slate-400">
            Unfinished items saved for later. Pull into today&apos;s list when ready.
          </p>
          <div className="mt-4 space-y-2">
            {backlog.map((t) => (
              <BacklogRow key={t.id} id={t.id} title={t.title} dayValue={dayValue} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
