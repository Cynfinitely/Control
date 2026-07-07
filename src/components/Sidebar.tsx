"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { navSections } from "@/lib/nav";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export default function Sidebar({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const first = drawerRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  const nav = (
    <>
      <div className="px-5 py-5">
        <Logo href="/dashboard" variant="mark" className="h-10 w-10" onClick={() => setOpen(false)} />
      </div>
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                >
                  <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        {isAdmin && (
          <div className="mb-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Admin
            </p>
            <Link
              href="/dashboard/admin"
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                pathname.startsWith("/dashboard/admin")
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <Icon name="users" className="h-5 w-5 shrink-0" />
              Admin
            </Link>
          </div>
        )}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{name}</p>
          <p className="truncate text-xs text-slate-400">{email}</p>
        </div>
        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          className={clsx(
            "btn-ghost touch-target mb-1 w-full",
            pathname.startsWith("/dashboard/settings") && "bg-brand-50 text-brand-700 dark:bg-brand-950"
          )}
        >
          <Icon name="settings" className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost touch-target w-full"
        >
          <Icon name="logout" className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="touch-target btn-ghost px-2"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <Logo href="/dashboard" variant="mark" className="h-9 w-9" />
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Navigation menu"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-700 dark:bg-slate-900 md:static md:z-auto md:w-60 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
