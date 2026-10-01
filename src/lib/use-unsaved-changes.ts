"use client";

import { useEffect } from "react";

const DEFAULT_MESSAGE = "You have unsaved changes. Leave without saving?";

/**
 * Warns before losing unsaved form text: the browser's beforeunload prompt for reloads/tab
 * closes, and a confirm() for in-app link clicks (day navigators, sidebar) while `dirty`.
 */
export function useUnsavedChangesWarning(dirty: boolean, message = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!dirty) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const next = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (next.origin !== current.origin) return;
      if (next.pathname === current.pathname && next.search === current.search) return; // hash-only
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, message]);
}
