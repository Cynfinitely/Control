"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { openCommandPalette } from "@/components/CommandPalette";
import { moduleFilter, type ModuleId } from "@/lib/modules";

const QUICK_ACTIONS: { href: string; label: string; icon: string; module: ModuleId }[] = [
  { href: "/dashboard/todos?focus=add", label: "Add todo", icon: "check", module: "todos" },
  { href: "/dashboard/plan?focus=add", label: "Plan a block", icon: "clock", module: "plan" },
  { href: "/dashboard/food?focus=log", label: "Log meal", icon: "food", module: "food" },
  { href: "/dashboard/exercise?focus=log", label: "Log workout", icon: "dumbbell", module: "exercise" },
  { href: "/dashboard/religious", label: "Log prayers", icon: "moon", module: "religious" },
  { href: "/dashboard/journal?focus=add", label: "Write journal", icon: "book", module: "journal" },
];

export default function HomeQuickActions({ disabledModules }: { disabledModules: ModuleId[] }) {
  const actions = moduleFilter(disabledModules).keep(QUICK_ACTIONS);
  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="section-title mb-3">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {actions.map((q) => (
          <Link key={q.href} href={q.href} className="btn-ghost touch-target justify-start sm:justify-center">
            <Icon name={q.icon} className="h-4 w-4 shrink-0" />
            {q.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={openCommandPalette}
          className="btn-ghost touch-target justify-start sm:justify-center"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Icon name="search" className="h-4 w-4 shrink-0" />
          All modules
        </button>
      </div>
    </section>
  );
}
