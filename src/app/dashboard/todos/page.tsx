import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  startOfDay,
  endOfDay,
  addDays,
  toDateInputValue,
  formatDayLabel,
  parseDayParam,
} from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import {
  createTodo,
  toggleTodo,
  deleteTodo,
  moveToBacklog,
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
  const prevDay = addDays(day, -1);
  const nextDay = addDays(day, 1);
  const dayLabel = formatDayLabel(day);

  const [dayTodos, backlog] = await Promise.all([
    prisma.todo.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        inBacklog: false,
        dayDate: { gte: startOfDay(day), lte: endOfDay(day) },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.todo.findMany({
      where: { userId: user.id, deletedAt: null, inBacklog: true, status: "open" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const open = dayTodos.filter((t) => t.status === "open");
  const done = dayTodos.filter((t) => t.status === "done");

  return (
    <div>
      <PageHeader title="Todos" description="Simple daily checklist — add tasks, check them off." />

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/todos?day=${toDateInputValue(prevDay)}`}
            className="btn-ghost touch-target px-3"
            aria-label="Previous day"
          >
            ←
          </Link>
          <div>
            <p className="font-semibold text-slate-900">{dayLabel}</p>
            <p className="text-xs text-slate-400">{toDateInputValue(day)}</p>
          </div>
          <Link
            href={`/dashboard/todos?day=${toDateInputValue(nextDay)}`}
            className="btn-ghost touch-target px-3"
            aria-label="Next day"
          >
            →
          </Link>
        </div>
        {!searchParams.day && open.length > 0 && (
          <form action={moveUnfinishedToBacklog}>
            <input type="hidden" name="dayDate" value={toDateInputValue(addDays(day, -1))} />
            <button type="submit" className="btn-ghost text-xs">
              Move yesterday&apos;s open to backlog
            </button>
          </form>
        )}
      </div>

      <form action={createTodo} className="card mb-6 flex gap-2">
        <input type="hidden" name="dayDate" value={toDateInputValue(day)} />
        <input
          name="title"
          className="input flex-1"
          placeholder="Add a todo for this day…"
          required
          autoComplete="off"
        />
        <button type="submit" className="btn-primary touch-target shrink-0">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {dayTodos.length === 0 && (
          <p className="text-sm text-slate-400">No todos for this day. Add one above.</p>
        )}
        {open.map((t) => (
          <TodoRow key={t.id} todo={t} showBacklog />
        ))}
        {done.length > 0 && (
          <>
            <p className="section-title mt-6 text-sm text-slate-500">Done ({done.length})</p>
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} />
            ))}
          </>
        )}
      </div>

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
                  <input type="hidden" name="dayDate" value={toDateInputValue(day)} />
                  <button type="submit" className="btn-ghost touch-target text-xs">
                    Add to today
                  </button>
                </form>
                <form action={deleteTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="touch-target text-slate-300 hover:text-red-500" title="Delete">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TodoRow({
  todo,
  showBacklog,
}: {
  todo: { id: string; title: string; status: string };
  showBacklog?: boolean;
}) {
  const isDone = todo.status === "done";
  return (
    <div className={`card flex items-center gap-3 py-3 ${isDone ? "opacity-70" : ""}`}>
      <form action={toggleTodo}>
        <input type="hidden" name="id" value={todo.id} />
        <button
          type="submit"
          className={`touch-target flex h-6 w-6 items-center justify-center rounded border ${
            isDone
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-300 hover:border-brand-500"
          }`}
          title={isDone ? "Mark open" : "Mark done"}
        >
          {isDone && <Icon name="check" className="h-3.5 w-3.5" />}
        </button>
      </form>
      <p className={`flex-1 ${isDone ? "text-slate-500 line-through" : "font-medium text-slate-800"}`}>
        {todo.title}
      </p>
      {showBacklog && !isDone && (
        <form action={moveToBacklog}>
          <input type="hidden" name="id" value={todo.id} />
          <button type="submit" className="btn-ghost touch-target text-xs">
            Backlog
          </button>
        </form>
      )}
      <form action={deleteTodo}>
        <input type="hidden" name="id" value={todo.id} />
        <button type="submit" className="touch-target text-slate-300 hover:text-red-500" title="Delete">
          <Icon name="trash" className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
