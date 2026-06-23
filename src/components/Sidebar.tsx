"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { navItems } from "@/lib/nav";
import Icon from "@/components/Icon";

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

  return (
    <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="text-2xl font-bold text-brand-700">
          Control
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
              pathname.startsWith("/dashboard/admin")
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon name="users" className="h-5 w-5" />
            Admin
          </Link>
        )}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-slate-700">{name}</p>
          <p className="truncate text-xs text-slate-400">{email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost w-full"
        >
          <Icon name="logout" className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
