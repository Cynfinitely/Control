"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId, str } from "@/lib/actions";
import { isValidTimezone } from "@/lib/timezones";

export type ActionState = {
  ok?: boolean;
  error?: string;
  name?: string;
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is required.").max(80),
  timezone: z.string().min(1, "Timezone is required."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters.").max(100),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    name: str(formData.get("name")),
    timezone: str(formData.get("timezone")),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { name, timezone } = parsed.data;
  if (!isValidTimezone(timezone)) {
    return { error: "Invalid timezone." };
  }

  try {
    const userId = await getUserId();
    await prisma.user.update({
      where: { id: userId },
      data: { name, timezone },
    });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { ok: true, name };
  } catch {
    return { error: "Could not update profile." };
  }
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({
    currentPassword: str(formData.get("currentPassword")),
    newPassword: str(formData.get("newPassword")),
    confirmPassword: str(formData.get("confirmPassword")),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const userId = await getUserId();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: "User not found." };
    }

    const currentOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentOk) {
      return { error: "Current password is incorrect." };
    }

    const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (samePassword) {
      return { error: "New password must be different from your current password." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  } catch {
    return { error: "Could not change password." };
  }
}
