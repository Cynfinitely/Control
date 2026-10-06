"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId, str } from "@/lib/actions";
import { isValidTimezone } from "@/lib/timezones";
import { revalidateUserCache } from "@/lib/cache";
import { failure, success, type ActionResult } from "@/lib/action-result";
import { searchLocations, type LocationResult } from "@/lib/weather/client";
import { MODULE_IDS, serializeDisabledModules, type ModuleId } from "@/lib/modules";

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

const weatherLocationSchema = z.object({
  locationName: z.string().trim().min(1, "Location name is required.").max(120),
  region: z.string().trim().max(160).nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  units: z.enum(["metric", "imperial"]),
});

export type WeatherLocationInput = z.infer<typeof weatherLocationSchema>;

function invalidateWeather(userId: string) {
  revalidateUserCache(userId, "weather", "dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/weather");
}

export async function searchWeatherLocations(
  query: string
): Promise<{ ok: true; results: LocationResult[] } | { ok: false; error: string }> {
  try {
    await getUserId();
    return { ok: true, results: await searchLocations(String(query).slice(0, 100)) };
  } catch {
    return { ok: false, error: "Location search is unavailable right now." };
  }
}

export async function saveWeatherLocation(input: WeatherLocationInput): Promise<ActionResult> {
  const parsed = weatherLocationSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.errors[0]?.message ?? "Invalid location.");
  }
  try {
    const userId = await getUserId();
    await prisma.weatherPreference.upsert({
      where: { userId },
      create: { userId, ...parsed.data },
      update: parsed.data,
    });
    invalidateWeather(userId);
    return success("Weather location saved");
  } catch {
    return failure("Could not save weather location.");
  }
}

export async function clearWeatherLocation(): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    await prisma.weatherPreference.deleteMany({ where: { userId } });
    invalidateWeather(userId);
    return success("Weather location removed");
  } catch {
    return failure("Could not remove weather location.");
  }
}

const modulesSchema = z.array(z.enum(MODULE_IDS as [ModuleId, ...ModuleId[]])).max(MODULE_IDS.length);

/** Saves which modules are switched off. Turning a module off only hides it; its data is kept. */
export async function saveModules(disabled: ModuleId[]): Promise<ActionResult> {
  const parsed = modulesSchema.safeParse(disabled);
  if (!parsed.success) return failure("Unknown module.");
  try {
    const userId = await getUserId();
    await prisma.user.update({
      where: { id: userId },
      data: { disabledModules: serializeDisabledModules(parsed.data) },
    });
    revalidateUserCache(userId, "modules", "dashboard");
    revalidatePath("/dashboard", "layout");
    return success("Modules saved");
  } catch {
    return failure("Could not save your modules.");
  }
}
