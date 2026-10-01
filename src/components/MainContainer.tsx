"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";

/** Pages that need more horizontal room than the default reading width. */
const WIDE_ROUTES = ["/dashboard/calendar", "/dashboard/food/planner"];

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wide = WIDE_ROUTES.some((route) => pathname.startsWith(route));
  return (
    <div className={clsx("mx-auto px-4 py-6 sm:px-6 sm:py-8", wide ? "max-w-7xl" : "max-w-5xl")}>{children}</div>
  );
}
