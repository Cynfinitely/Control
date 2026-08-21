import Link from "next/link";
import FormAction from "@/components/FormAction";
import SubmitButton from "@/components/SubmitButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import TodoList from "@/app/dashboard/todos/TodoList";
import { createTodoForm } from "@/app/dashboard/todos/actions";
import type { TodoItem } from "@/lib/queries/todos";

type Props = {
  todos: TodoItem[];
  dayValue: string;
};

export default function HomeTodosCard({ todos, dayValue }: Props) {
  const open = todos.filter((t) => t.status === "open").length;
  const done = todos.filter((t) => t.status === "done").length;

  return (
    <section className="card mb-6">
      <CollapsibleSection title="Today's todos" count={todos.length} defaultOpen>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            {todos.length === 0
              ? "Add a task for today."
              : `${open} open${done > 0 ? ` · ${done} done` : ""}`}
          </p>
          <Link href="/dashboard/todos" className="text-xs text-brand-600 hover:underline">
            Open todos
          </Link>
        </div>

        <FormAction
          action={createTodoForm}
          successMessage="Todo added"
          resetOnSuccess
          className="mb-4 flex gap-2"
        >
          <input type="hidden" name="dayDate" value={dayValue} />
          <input type="hidden" name="priority" value="medium" />
          <label htmlFor="home-todo-title" className="sr-only">
            Todo title
          </label>
          <input
            id="home-todo-title"
            name="title"
            className="input flex-1"
            placeholder="Add a todo…"
            required
            autoComplete="off"
          />
          <SubmitButton className="btn-primary shrink-0">Add</SubmitButton>
        </FormAction>

        <TodoList initialTodos={todos} compact />
      </CollapsibleSection>
    </section>
  );
}
