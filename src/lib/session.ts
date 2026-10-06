import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDisabledModules } from "@/lib/queries/modules";
import type { ModuleId } from "@/lib/modules";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/** Like requireUser, but sends the user Home when they have switched this module off. */
export async function requireModule(id: ModuleId) {
  const user = await requireUser();
  const disabled = await getDisabledModules(user.id);
  if (disabled.includes(id)) {
    redirect("/dashboard");
  }
  return user;
}
