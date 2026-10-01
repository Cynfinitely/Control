"use client";

import { useEffect, useRef } from "react";

/**
 * Horizontally scrolls a scrollable row so its `[aria-current]` child is visible
 * (e.g. the active tab on a narrow screen). Never scrolls the page vertically.
 */
export default function ScrollActiveIntoView({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const row = ref.current;
    const active = row?.querySelector<HTMLElement>("[aria-current]");
    if (!row || !active || row.scrollWidth <= row.clientWidth) return;
    const left = active.offsetLeft - row.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) {
      row.scrollLeft = Math.max(0, left - (row.clientWidth - active.offsetWidth) / 2);
    }
  });

  return (
    <nav ref={ref} className={className} {...rest}>
      {children}
    </nav>
  );
}
