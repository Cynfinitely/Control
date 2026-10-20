"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import Icon from "@/components/Icon";
import { useIsClient, useLocalStorage } from "@/lib/use-client-store";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function subscribeSystemTheme(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [stored, setTheme] = useLocalStorage("control-theme");
  const theme: Theme = isTheme(stored) ? stored : "system";
  const system = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    (): "light" | "dark" => "light"
  );
  const resolved = theme === "system" ? system : theme;
  // The inline <head> script already applied the stored theme; don't touch the
  // class until hydrated, when the stored value is read (avoids a flash).
  const hydrated = useIsClient();

  useEffect(() => {
    if (hydrated) applyThemeClass(resolved);
  }, [hydrated, resolved]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <label htmlFor="theme-select" className="label">
        Theme
      </label>
      <select
        id="theme-select"
        className="input w-full max-w-xs"
        value={theme}
        onChange={e => setTheme(e.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}

const THEME_ORDER: Theme[] = ["system", "light", "dark"];
const THEME_LABEL: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};
const THEME_ICON: Record<Theme, string> = {
  system: "settings",
  light: "sun",
  dark: "moon",
};

/** Compact cycle button (System → Light → Dark) for the sidebar footer. */
export function ThemeQuickToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next =
    THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={className ?? "btn-icon"}
      aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[next]}`}
      title={`Theme: ${THEME_LABEL[theme]}`}
    >
      <Icon name={THEME_ICON[theme]} className="h-5 w-5" />
    </button>
  );
}
