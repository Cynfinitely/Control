import { useCallback, useSyncExternalStore } from "react";

// Browser-only values read through useSyncExternalStore: the server render and
// the hydration render use the server snapshot, so nothing mismatches, and no
// effect has to copy the value into state after mount.

const noopSubscribe = () => () => {};

/** False during SSR and the hydration render, true afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * A value only the browser can compute (clock, platform). `getSnapshot` must
 * return a primitive or a cached object; `serverValue` is used until hydrated.
 */
export function useClientSnapshot<T>(getSnapshot: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, getSnapshot, () => serverValue);
}

/** Mac-style shortcut labels (⌘ vs Ctrl). Assumes Mac until hydrated. */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => true
  );
}

// Writes go to memory too, so the UI still updates when storage is unavailable
// (private mode, blocked site data).
const memoryStorage = new Map<string, string>();
const storageListeners = new Set<() => void>();

function subscribeStorage(listener: () => void) {
  storageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    storageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memoryStorage.get(key) ?? null;
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

/** A localStorage entry as state. `null` on the server and when unset. */
export function useLocalStorage(
  key: string
): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribeStorage,
    () => readStorage(key),
    () => null
  );
  const setValue = useCallback(
    (next: string) => {
      memoryStorage.set(key, next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // storage unavailable — the in-memory copy keeps the UI in sync
      }
      storageListeners.forEach(listener => listener());
    },
    [key]
  );
  return [value, setValue];
}
