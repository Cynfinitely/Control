"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { navSections, type NavItem } from "@/lib/nav";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import { openCommandPalette } from "@/components/CommandPalette";
import { ThemeQuickToggle } from "@/components/ThemeProvider";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Keep Tab focus inside the open drawer.
      if (e.key === "Tab" && drawer) {
        const nodes = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      menuButtonRef.current?.focus();
    };
  }, [open]);

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  function renderNavLink(item: NavItem) {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "flex min-h-[40px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
          active
            ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        )}
      >
        <Icon name={item.icon} className="h-5 w-5 shrink-0" />
        {item.label}
      </Link>
    );
  }

  const sections = isAdmin
    ? [...navSections, { title: "Admin", items: [{ href: "/dashboard/admin", label: "Admin", icon: "users" }] }]
    : navSections;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-1 border-b border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900 md:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          className="btn-icon"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="app-sidebar"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <Logo href="/dashboard" variant="mark" className="h-9 w-9" />
        <div className="ml-auto flex items-center">
          <button type="button" onClick={openCommandPalette} className="btn-icon" aria-label="Search">
            <Icon name="search" className="h-5 w-5" />
          </button>
          <NotificationBell align="right" />
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 md:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
      )}

      <aside
        id="app-sidebar"
        ref={drawerRef}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? "Navigation menu" : undefined}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white duration-200 dark:border-slate-700 dark:bg-slate-900",
          "md:sticky md:top-0 md:z-auto md:h-screen md:w-60 md:translate-x-0 md:visible",
          // Visible immediately on open (so focus can move in); hidden only after the slide-out.
          open ? "visible translate-x-0 transition-transform" : "invisible -translate-x-full transition-[transform,visibility]"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
          <Logo href="/dashboard" variant="mark" className="h-10 w-10" />
          <div className="hidden md:block">
            <NotificationBell align="left" />
          </div>
          <button
            type="button"
            data-drawer-close
            onClick={() => setOpen(false)}
            className="btn-icon md:hidden"
            aria-label="Close menu"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openCommandPalette();
            }}
            className="flex min-h-[40px] w-full items-center gap-2 rounded-md bg-slate-100 px-3 text-sm text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <Icon name="search" className="h-4 w-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden rounded bg-white px-1.5 text-xs font-sans text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 md:inline">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Main navigation">
          {sections.map((section) => (
            <div key={section.title} className="mt-3 first:mt-1">
              <h2 className="eyebrow mb-1 px-3">{section.title}</h2>
              <div className="space-y-0.5">
                {section.items.map((item) => renderNavLink(item))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>
            </div>
            <ThemeQuickToggle />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/settings"
              prefetch={false}
              aria-current={pathname.startsWith("/dashboard/settings") ? "page" : undefined}
              className={clsx(
                "btn-ghost btn-sm min-h-[40px]",
                pathname.startsWith("/dashboard/settings") &&
                  "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950 dark:text-brand-300"
              )}
            >
              <Icon name="settings" className="h-4 w-4" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-ghost btn-sm min-h-[40px]"
            >
              <Icon name="logout" className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
