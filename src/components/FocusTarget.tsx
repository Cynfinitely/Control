"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  param?: string;
  children: React.ReactNode;
};

export default function FocusTarget({ param = "focus", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const shouldFocus = searchParams.get(param);

  useEffect(() => {
    if (!shouldFocus || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = ref.current.querySelector<HTMLElement>(
      "input:not([type=hidden]), textarea, select, button"
    );
    input?.focus();
  }, [shouldFocus]);

  return <div ref={ref}>{children}</div>;
}
