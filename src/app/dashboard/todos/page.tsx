import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import { getBacklogTodos, getDayTodos, getStaleOpenTodoCount } from "@/lib/queries/todos";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import FormAction from "@/components/FormAction";
import FocusTarget from "@/components/FocusTarget";
import StaleBacklogButton from "@/components/StaleBacklogButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import TodoList from "./TodoList";
import BacklogRow from "./BacklogRow";
import { createTodoForm } from "./actions";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: { day?: string; focus?: string };
}) {
  const user = await requireUser();
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);

  const [dayTodos, backlog, staleCount] = await Promise.all([
    getDayTodos(user.id, dayValue),
    getBacklogTodos(user.id),
    getStaleOpenTodoCount(user.id),
  ]);

  return (
    <div>
      <PageHeader title="Todos" description="Simple daily checklist — add tasks, check them off." />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator basePath="/dashboard/todos" dayValue={dayValue} dayLabel={dayLabel} />
        {staleCount > 0 && <StaleBacklogButton count={staleCount} />}
      </div>

      <Suspense fallback={null}>
        <FocusTarget param="focus">
          <FormAction
            action={createTodoForm}
            successMessage="Todo added"
            resetOnSuccess
            className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <input type="hidden" name="dayDate" value={dayValue} />
            <div className="sm:col-span-2 lg:col-span-5">
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
            <div>
              <label htmlFor="todo-destination" className="label">
                Add to
              </label>
              <select id="todo-destination" name="destination" className="input" defaultValue="day">
                <option value="day">This day</option>
                <option value="backlog">Backlog</option>
              </select>
            </div>
            <div className="flex items-end">
              <SubmitButton className="btn-primary touch-target w-full">Add</SubmitButton>
            </div>
          </FormAction>
        </FocusTarget>
      </Suspense>

      <TodoList initialTodos={dayTodos} />

      <CollapsibleSection
        title="Backlog"
        count={backlog.length}
        defaultOpen={backlog.length === 0}
        className="card mt-8"
      >
        <p className="text-xs text-slate-400">
          {backlog.length === 0
            ? "Nothing saved for later."
            : "Unfinished items saved for later. Pull into today's list when ready."}
        </p>
        <FormAction
          action={createTodoForm}
          successMessage="Added to backlog"
          resetOnSuccess
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input type="hidden" name="destination" value="backlog" />
          <input type="hidden" name="priority" value="medium" />
          <input type="hidden" name="dayDate" value={dayValue} />
          <label htmlFor="backlog-title" className="sr-only">
            Backlog title
          </label>
          <input
            id="backlog-title"
            name="title"
            className="input flex-1"
            placeholder="Add to backlog for later…"
            required
            autoComplete="off"
          />
          <SubmitButton className="btn-primary shrink-0">Add</SubmitButton>
        </FormAction>
        {backlog.length > 0 && (
          <div className="mt-4 space-y-2">
            {backlog.map((t) => (
              <BacklogRow key={t.id} id={t.id} title={t.title} dayValue={dayValue} />
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
