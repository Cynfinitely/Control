import { Suspense } from "react";
import { requireModule } from "@/lib/session";
import { toDateInputValue, formatDayLabel, parseDayParam } from "@/lib/date";
import {
  getBacklogTodos,
  getDayTodos,
  getStaleOpenTodoCount,
  getTodoCategories,
} from "@/lib/queries/todos";
import { mergeCategories } from "@/lib/todo-meta";
import PageHeader from "@/components/PageHeader";
import DayNavigator from "@/components/DayNavigator";
import FocusTarget from "@/components/FocusTarget";
import StaleBacklogButton from "@/components/StaleBacklogButton";
import CollapsibleSection from "@/components/CollapsibleSection";
import TodoList from "./TodoList";
import BacklogRow from "./BacklogRow";
import TodoAddForm from "./TodoAddForm";

export const metadata = { title: "Todos" };

export default async function TodosPage(props: {
  searchParams: Promise<{ day?: string; focus?: string }>;
}) {
  const searchParams = await props.searchParams;
  const user = await requireModule("todos");
  const day = parseDayParam(searchParams.day);
  const dayValue = toDateInputValue(day);
  const dayLabel = formatDayLabel(day);
  const dayName =
    dayLabel === "Today" || dayLabel === "Yesterday"
      ? dayLabel.toLowerCase()
      : dayLabel;

  const [dayTodos, backlog, staleCount, userCategories] = await Promise.all([
    getDayTodos(user.id, dayValue),
    getBacklogTodos(user.id),
    getStaleOpenTodoCount(user.id),
    getTodoCategories(user.id),
  ]);
  const categoryPills = mergeCategories(userCategories);

  return (
    <div>
      <PageHeader
        help="todos"
        title="Todos"
        description="Your daily checklist, split into work time and after work."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <DayNavigator
          basePath="/dashboard/todos"
          dayValue={dayValue}
          dayLabel={dayLabel}
        />
        {staleCount > 0 && <StaleBacklogButton count={staleCount} />}
      </div>

      <Suspense fallback={null}>
        <FocusTarget param="focus">
          <TodoAddForm
            dayValue={dayValue}
            dayLabel={dayLabel}
            categories={categoryPills}
          />
        </FocusTarget>
      </Suspense>

      <TodoList initialTodos={dayTodos} categories={categoryPills} />

      {/* Keyed so it opens when the first item arrives instead of staying collapsed. */}
      <CollapsibleSection
        key={backlog.length > 0 ? "backlog" : "backlog-empty"}
        title="Backlog"
        as="h2"
        count={backlog.length}
        defaultOpen={backlog.length > 0}
        className="card mt-8"
      >
        {backlog.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing saved for later. To park a todo here, open “More options”
            above and choose “Backlog” under “Add to”.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Saved for later. Pull items into{" "}
              {dayName === "today" ? "today’s" : "this day’s"} list when you’re
              ready.
            </p>
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
              {backlog.map(t => (
                <BacklogRow
                  key={t.id}
                  todo={t}
                  categories={categoryPills}
                  dayValue={dayValue}
                  dayName={dayName}
                />
              ))}
            </ul>
          </>
        )}
      </CollapsibleSection>
    </div>
  );
}
