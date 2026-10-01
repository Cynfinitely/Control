"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  param?: string;
  /** Only react to this value of the param (e.g. "add"). Any value when omitted. */
  value?: string;
  children: React.ReactNode;
};

/**
 * Scrolls to and focuses the first field inside when `?focus=` is present.
 * Opens any collapsed <details> inside first so deep links like
 * "/dashboard/goals?focus=add" land on a usable form.
 */
export default function FocusTarget({ param = "focus", value, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const current = searchParams.get(param);
  const shouldFocus = current !== null && (value === undefined || current === value);

  useEffect(() => {
    const root = ref.current;
    if (!shouldFocus || !root) return;
    root.querySelectorAll("details").forEach((d) => {
      if (!d.open) d.open = true;
    });
    // Let the opened <details> render before focusing.
    const frame = requestAnimationFrame(() => {
      root.scrollIntoView({ behavior: "smooth", block: "center" });
      root
        .querySelector<HTMLElement>(
          "input:not([type=hidden]):not([disabled]), textarea, select, button[type=submit]"
        )
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldFocus]);

  return <div ref={ref}>{children}</div>;
}
