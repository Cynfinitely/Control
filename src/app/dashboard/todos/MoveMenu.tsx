"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import IconButton from "@/components/IconButton";
import type { TodoItem } from "@/lib/queries/todos";

export type MoveTarget = "top" | "bottom";

/** Custom-order controls: the row's 1-based rank, drag handle and move menu. */
export type RowReorder = {
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveTo: (id: string, target: MoveTarget) => void;
  /** The dnd-kit drag handle, rendered at the start of the row. */
  handle: React.ReactNode;
};

/** "⋮" menu with Move to top / Move to bottom. */
export default function MoveMenu({
  todo,
  reorder,
}: {
  todo: TodoItem;
  reorder: RowReorder;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>("button:enabled")
      ?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      )
        setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function choose(target: MoveTarget) {
    setOpen(false);
    reorder.onMoveTo(todo.id, target);
  }

  const items: { target: MoveTarget; label: string; icon: string }[] = [
    { target: "top", label: "Move to top", icon: "arrowUpToLine" },
    { target: "bottom", label: "Move to bottom", icon: "arrowDownToLine" },
  ];

  return (
    <div className="relative">
      <IconButton
        ref={buttonRef}
        icon="moreVertical"
        aria-label={`Move options for “${todo.title}”`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      />
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {items.map(item => (
            <button
              key={item.target}
              type="button"
              role="menuitem"
              disabled={
                item.target === "top" ? reorder.isFirst : reorder.isLast
              }
              onClick={() => choose(item.target)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:bg-slate-700"
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
