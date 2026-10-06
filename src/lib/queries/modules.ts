import { prisma } from "@/lib/db";
import { cacheTag, cachedQuery } from "@/lib/cache";
import { parseDisabledModules, type ModuleId } from "@/lib/modules";

export type ModuleState = {
  /** Modules the user switched off. Everything else is on. */
  disabled: ModuleId[];
  /** True while a new account still has to go through first-run setup. */
  needsOnboarding: boolean;
};

export function getModuleState(userId: string): Promise<ModuleState> {
  return cachedQuery(["module-state", userId], [cacheTag("modules", userId)], async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { disabledModules: true, needsOnboarding: true },
    });
    return {
      disabled: parseDisabledModules(user?.disabledModules),
      needsOnboarding: user?.needsOnboarding ?? false,
    };
  });
}

export async function getDisabledModules(userId: string): Promise<ModuleId[]> {
  return (await getModuleState(userId)).disabled;
}
