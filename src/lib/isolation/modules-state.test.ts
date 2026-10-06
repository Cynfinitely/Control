import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createTestDatabase, sqliteClientAvailable } from "./test-db";

/**
 * Module selection and first-run setup, end to end against a real database:
 * what a new account starts with, what onboarding and Settings save, and that
 * one user's choices never affect another's.
 */

let currentUserId = "";

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: currentUserId, role: "user" } }),
}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidateTag: () => {},
  revalidatePath: () => {},
}));

describe.skipIf(!sqliteClientAvailable())("module selection and onboarding", () => {
  let prisma: PrismaClient;
  let cleanup = () => {};
  let newcomer = "";
  let existing = "";

  beforeAll(async () => {
    ({ cleanup } = createTestDatabase("modules"));
    ({ prisma } = await import("@/lib/db"));
    const invites = await import("@/lib/invites");

    // An account that existed before modules were introduced: column defaults only.
    existing = (await prisma.user.create({ data: { email: "old@test.local", passwordHash: "x" } })).id;

    const invite = await prisma.inviteCode.create({
      data: { code: invites.generateInviteCode(), createdById: existing, expiresAt: invites.inviteExpiry(7) },
    });
    const result = await invites.registerWithInvite({
      name: "New",
      email: "new@test.local",
      password: "correct-horse-battery",
      inviteCode: invite.code,
    });
    if (!result.ok) throw new Error(result.error);
    newcomer = result.userId;
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    cleanup();
  });

  it("sends a newly registered account through setup, but not an existing one", async () => {
    const { getModuleState } = await import("@/lib/queries/modules");
    expect(await getModuleState(newcomer)).toEqual({ disabled: [], needsOnboarding: true });
    expect(await getModuleState(existing)).toEqual({ disabled: [], needsOnboarding: false });
  });

  it("onboarding saves the selection and is only needed once", async () => {
    const { completeOnboarding } = await import("@/app/onboarding/actions");
    const { getModuleState } = await import("@/lib/queries/modules");

    currentUserId = newcomer;
    expect((await completeOnboarding(["budget", "weather"])).ok).toBe(true);
    // Stored in registry order, whatever order they were picked in.
    expect(await getModuleState(newcomer)).toEqual({ disabled: ["weather", "budget"], needsOnboarding: false });

    // Someone else's settings are untouched.
    expect(await getModuleState(existing)).toEqual({ disabled: [], needsOnboarding: false });
  });

  it("Settings can change the selection later, including switching everything back on", async () => {
    const { saveModules } = await import("@/app/dashboard/settings/actions");
    const { getDisabledModules } = await import("@/lib/queries/modules");

    currentUserId = newcomer;
    expect((await saveModules(["reports"])).ok).toBe(true);
    expect(await getDisabledModules(newcomer)).toEqual(["reports"]);
    expect((await saveModules([])).ok).toBe(true);
    expect(await getDisabledModules(newcomer)).toEqual([]);
  });

  it("rejects unknown module ids without changing anything", async () => {
    const { saveModules } = await import("@/app/dashboard/settings/actions");
    const { completeOnboarding } = await import("@/app/onboarding/actions");
    const { getDisabledModules } = await import("@/lib/queries/modules");

    currentUserId = newcomer;
    await saveModules(["journal"]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((await saveModules(["journal", "not-a-module"] as any)).ok).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((await completeOnboarding(["home"] as any)).ok).toBe(false);
    expect(await getDisabledModules(newcomer)).toEqual(["journal"]);
  });

  it("switching a module off keeps its data", async () => {
    const { saveModules } = await import("@/app/dashboard/settings/actions");
    currentUserId = newcomer;
    await prisma.todo.create({ data: { userId: newcomer, title: "Keep me" } });
    await saveModules(["todos"]);
    expect(await prisma.todo.count({ where: { userId: newcomer } })).toBe(1);
    await saveModules([]);
    expect(await prisma.todo.count({ where: { userId: newcomer } })).toBe(1);
  });
});
