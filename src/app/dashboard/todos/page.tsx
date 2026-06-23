import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icon";
import { createTodo, toggleTodo, deleteTodo } from "./actions";

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default async function TodosPage() {
  const user = await requireUser();
  const todos = await prisma.todo.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const open = todos.filter((t) => t.status === "open");
  const done = todos.filter((t) => t.status === "done");
  const now = new Date();

  return (
    <div>
      <PageHeader title="Todos" description="Capture tasks, set priorities, and track completion." />

      <details className="card mb-6">
        <summary className="cursor-pointer font-medium text-brand-700">+ Add todo</summary>
        <form action={createTodo} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input name="title" className="input" required />
          </div>
          <div>
            <label className="label">Category</label>
            <input name="category" className="input" placeholder="e.g. Work" />
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input name="dueDate" type="date" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" className="input" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Add todo</button>
          </div>
        </form>
      </details>

      <h2 className="section-title mb-3">Open ({open.length})</h2>
      <div className="space-y-2">
        {open.length === 0 && <p className="text-sm text-slate-400">Nothing open. Nice work.</p>}
        {open.map((t) => {
          const overdue = t.dueDate && t.dueDate < now;
          return (
            <div key={t.id} className="card flex items-center gap-3 py-3">
              <form action={toggleTodo}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 hover:border-brand-500"
                  title="Mark done"
                />
              </form>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{t.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className={`badge ${priorityStyles[t.priority]}`}>{t.priority}</span>
                  {t.category && <span>{t.category}</span>}
                  {t.dueDate && (
                    <span className={overdue ? "font-medium text-red-600" : ""}>
                      due {formatDate(t.dueDate)}
                    </span>
                  )}
                </div>
                {t.notes && <p className="mt-1 text-sm text-slate-500">{t.notes}</p>}
              </div>
              <form action={deleteTodo}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-slate-300 hover:text-red-500" title="Delete">
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <>
          <h2 className="section-title mb-3 mt-8">Completed ({done.length})</h2>
          <div className="space-y-2">
            {done.map((t) => (
              <div key={t.id} className="card flex items-center gap-3 py-3 opacity-70">
                <form action={toggleTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    className="flex h-5 w-5 items-center justify-center rounded bg-brand-600 text-white"
                    title="Mark open"
                  >
                    <Icon name="check" className="h-3 w-3" />
                  </button>
                </form>
                <p className="flex-1 text-slate-500 line-through">{t.title}</p>
                <form action={deleteTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-slate-300 hover:text-red-500" title="Delete">
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
