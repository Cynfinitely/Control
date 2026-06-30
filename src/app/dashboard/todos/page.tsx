import { requireUser } from "@/lib/session";
import { toDateInputValue, addDays, formatDayLabel, parseDayParam } from "@/lib/date";
import { getBacklogTodos, getDayTodos } from "@/lib/queries/todos";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import DayNavigator from "@/components/DayNavigator";
import SubmitButton from "@/components/SubmitButton";
import SubmitIconButton from "@/components/SubmitIconButton";
import TodoList from "./TodoList";
import {
  createTodo,
  deleteTodo,
  pullFromBacklog,
  moveUnfinishedToBacklog,
} from "./actions";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: { day?: string };
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
          <form action={moveUnfinishedToBacklog}>
            <input type="hidden" name="dayDate" value={toDateInputValue(addDays(day, -1))} />
            <SubmitButton className="btn-ghost text-xs">Move yesterday&apos;s open to backlog</SubmitButton>
          </form>
        )}
      </div>

      <form action={createTodo} className="card mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="dayDate" value={dayValue} />
        <div className="sm:col-span-2 lg:col-span-4">
          <input
            name="title"
            className="input w-full"
            placeholder="Add a todo for this day…"
            required
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label">Priority</label>
          <select name="priority" className="input" defaultValue="medium">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <input name="category" className="input" placeholder="e.g. work, health" />
        </div>
        <div>
          <label className="label">Due date</label>
          <input name="dueDate" type="date" className="input" />
        </div>
        <div className="flex items-end">
          <SubmitButton className="btn-primary touch-target w-full">Add</SubmitButton>
        </div>
      </form>

      <TodoList initialTodos={dayTodos} />

      {backlog.length > 0 && (
        <details className="card mt-8">
          <summary className="cursor-pointer font-medium text-slate-700">
            Backlog ({backlog.length})
          </summary>
          <p className="mt-2 text-xs text-slate-400">
            Unfinished items saved for later. Pull into today&apos;s list when ready.
          </p>
          <div className="mt-4 space-y-2">
            {backlog.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <span className="flex-1 text-slate-700">{t.title}</span>
                <form action={pullFromBacklog}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="dayDate" value={dayValue} />
                  <SubmitButton className="btn-ghost touch-target text-xs">Add to today</SubmitButton>
                </form>
                <form action={deleteTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitIconButton
                    className="touch-target text-slate-300 hover:text-red-500"
                    title="Delete"
                    icon={<Icon name="trash" className="h-4 w-4" />}
                  />
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
