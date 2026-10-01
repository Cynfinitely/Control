import Link from "next/link";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import TodoList from "@/app/dashboard/todos/TodoList";
import { createTodoForm } from "@/app/dashboard/todos/actions";
import type { TodoItem } from "@/lib/queries/todos";

type Props = {
  todos: TodoItem[];
  dayValue: string;
  /** Open todos past their due date (any day). */
  overdueCount?: number;
};

export default function HomeTodosCard({ todos, dayValue, overdueCount = 0 }: Props) {
  const open = todos.filter((t) => t.status === "open").length;
  const done = todos.filter((t) => t.status === "done").length;

  return (
    <section className="card mb-6" aria-labelledby="home-todos-title">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="home-todos-title" className="section-title">
            Today&apos;s todos
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>
              {todos.length === 0
                ? "Nothing on today's list yet."
                : `${open} open · ${done} done`}
            </span>
            {overdueCount > 0 && (
              <Link href="/dashboard/todos" className="badge-danger hover:underline">
                {overdueCount} overdue
              </Link>
            )}
          </p>
        </div>
        <Link href="/dashboard/todos" className="btn-ghost btn-sm min-h-[40px]">
          All todos
        </Link>
      </div>

      <FormAction
        action={createTodoForm}
        successMessage="Todo added"
        resetOnSuccess
        className="mb-3 flex gap-2"
      >
        <input type="hidden" name="dayDate" value={dayValue} />
        <input type="hidden" name="priority" value="medium" />
        <label htmlFor="home-todo-title" className="sr-only">
          New todo for today
        </label>
        <input
          id="home-todo-title"
          name="title"
          className="input min-w-0 flex-1"
          placeholder="Add a todo…"
          required
          autoComplete="off"
        />
        <SubmitButton className="btn-primary shrink-0">Add</SubmitButton>
      </FormAction>

      <TodoList initialTodos={todos} compact />
    </section>
  );
}
