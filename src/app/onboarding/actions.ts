"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/actions";
import { revalidateUserCache } from "@/lib/cache";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { MODULE_IDS, serializeDisabledModules, type ModuleId } from "@/lib/modules";

const modulesSchema = z.array(z.enum(MODULE_IDS as [ModuleId, ...ModuleId[]])).max(MODULE_IDS.length);

/** Saves the first module selection and marks first-run setup as done. */
export async function completeOnboarding(disabled: ModuleId[]): Promise<ActionResult> {
  const parsed = modulesSchema.safeParse(disabled);
  if (!parsed.success) return failure("Unknown module.");
  try {
    const userId = await getUserId();
    await prisma.user.update({
      where: { id: userId },
      data: { disabledModules: serializeDisabledModules(parsed.data), needsOnboarding: false },
    });
    revalidateUserCache(userId, "modules", "dashboard");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/onboarding");
    return success();
  } catch {
    return failure("Could not save your choices. Please try again.");
  }
}
