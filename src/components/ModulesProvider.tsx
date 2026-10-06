"use client";

import { createContext, useContext, useMemo } from "react";
import { moduleFilter, type ModuleFilter, type ModuleId } from "@/lib/modules";

const ModulesContext = createContext<readonly ModuleId[]>([]);

/** Makes the signed-in user's switched-off modules available to client components. */
export default function ModulesProvider({
  disabled,
  children,
}: {
  disabled: readonly ModuleId[];
  children: React.ReactNode;
}) {
  return <ModulesContext.Provider value={disabled}>{children}</ModulesContext.Provider>;
}

/** `useModules().has("budget")` is false when the user switched Budget off. */
export function useModules(): ModuleFilter {
  const disabled = useContext(ModulesContext);
  return useMemo(() => moduleFilter(disabled), [disabled]);
}
