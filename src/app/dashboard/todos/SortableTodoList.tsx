"use client";

import { useId } from "react";
import clsx from "clsx";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import Icon from "@/components/Icon";
import { moveIdTo } from "@/lib/todo-sort";
import type { TodoItem } from "@/lib/queries/todos";
import TodoRow, { type MoveTarget } from "./TodoRow";

type RowHandlers = {
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onBacklog: (id: string) => void;
  onMoveTo: (id: string, target: MoveTarget) => void;
  pending: boolean;
};

type Props = RowHandlers & {
  todos: TodoItem[];
  /** Called with the full new id order after a drop. */
  onReorder: (ids: string[]) => void;
};

function SortableRow({
  todo,
  index,
  count,
  handlers,
}: {
  todo: TodoItem;
  index: number;
  count: number;
  handlers: RowHandlers;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  return (
    <TodoRow
      todo={todo}
      showBacklog
      onToggle={handlers.onToggle}
      onDelete={handlers.onDelete}
      onBacklog={handlers.onBacklog}
      pending={handlers.pending}
      rowRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      isDragging={isDragging}
      reorder={{
        rank: index + 1,
        isFirst: index === 0,
        isLast: index === count - 1,
        onMoveTo: handlers.onMoveTo,
        handle: (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder “${todo.title}”`}
            title="Drag to reorder"
            className={clsx(
              "btn-icon -ml-2 w-8 touch-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
          >
            <Icon name="grip" className="h-4 w-4" />
          </button>
        ),
      }}
    />
  );
}

/** Open todos in custom order: drag a row's handle to put it anywhere. */
export default function SortableTodoList({
  todos,
  onReorder,
  ...handlers
}: Props) {
  const dndId = useId();
  const sensors = useSensors(
    // A small distance keeps plain clicks on the handle from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Press-and-hold on touch so swiping over the list still scrolls the page.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const ids = todos.map(t => t.id);

  const titleOf = (id: UniqueIdentifier) =>
    todos.find(t => t.id === id)?.title ?? "todo";
  const positionOf = (id: UniqueIdentifier | undefined) =>
    id === undefined ? 0 : ids.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up “${titleOf(active.id)}”, position ${positionOf(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `“${titleOf(active.id)}” moved to position ${positionOf(over.id)} of ${ids.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `“${titleOf(active.id)}” dropped at position ${positionOf(over.id)} of ${ids.length}.`
        : `“${titleOf(active.id)}” dropped.`,
    onDragCancel: ({ active }) =>
      `Reordering cancelled. “${titleOf(active.id)}” returned to position ${positionOf(active.id)}.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = moveIdTo(ids, String(active.id), ids.indexOf(String(over.id)));
    if (next !== ids) onReorder(next);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{ announcements }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {/* overflow-visible so a row's move menu isn't clipped by the card. */}
        <ul className="card-flush divide-y divide-slate-100 overflow-visible dark:divide-slate-700">
          {todos.map((t, i) => (
            <SortableRow
              key={t.id}
              todo={t}
              index={i}
              count={todos.length}
              handlers={handlers}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
