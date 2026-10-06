import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createTestDatabase, sqliteClientAvailable } from "./test-db";

/**
 * Invite-only registration: only a valid, unexpired, unused invite creates an
 * account, an invite cannot be used more often than allowed, and the new
 * account starts empty.
 */
describe.skipIf(!sqliteClientAvailable())("registering with an invite", () => {
  let prisma: PrismaClient;
  let invites: typeof import("@/lib/invites");
  let cleanup = () => {};
  let adminId = "";
  let counter = 0;

  const person = (inviteCode: string, email?: string) => ({
    name: "New Person",
    email: email ?? `person${++counter}@test.local`,
    password: "correct-horse-battery",
    inviteCode,
  });

  async function makeInvite(data: { email?: string; maxUses?: number; expiresAt?: Date } = {}) {
    return prisma.inviteCode.create({
      data: {
        code: invites.generateInviteCode(),
        createdById: adminId,
        maxUses: data.maxUses ?? 1,
        expiresAt: data.expiresAt ?? invites.inviteExpiry(7),
        email: data.email,
      },
    });
  }

  beforeAll(async () => {
    ({ cleanup } = createTestDatabase("register"));
    ({ prisma } = await import("@/lib/db"));
    invites = await import("@/lib/invites");
    adminId = (
      await prisma.user.create({ data: { email: "admin@test.local", passwordHash: "x", role: "admin", emailVerifiedAt: new Date() } })
    ).id;
    await prisma.todo.create({ data: { userId: adminId, title: "Admin's private todo" } });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    cleanup();
  });

  it("generates long, unique, URL-safe codes", () => {
    const codes = new Set(Array.from({ length: 200 }, () => invites.generateInviteCode()));
    expect(codes.size).toBe(200);
    for (const code of codes) expect(code).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("caps invite lifetime", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const day = 24 * 60 * 60 * 1000;
    expect(invites.inviteExpiry(7, from).getTime() - from.getTime()).toBe(7 * day);
    expect(invites.inviteExpiry(365, from).getTime() - from.getTime()).toBe(invites.INVITE_MAX_DAYS * day);
    expect(invites.inviteExpiry(0, from).getTime() - from.getTime()).toBe(invites.INVITE_DEFAULT_DAYS * day);
  });

  it("creates an empty, usable account from a valid invite", async () => {
    const invite = await makeInvite();
    const result = await invites.registerWithInvite(person(invite.code, "Fresh@Test.Local"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
    expect(user.email).toBe("fresh@test.local");
    expect(user.role).toBe("user");
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.passwordHash).not.toContain("correct-horse");

    // Nothing but the default nutrition target, and none of the admin's data.
    expect(await prisma.todo.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.nutritionTarget.count({ where: { userId: user.id } })).toBe(1);
    expect(await prisma.verificationToken.count({ where: { userId: user.id } })).toBe(0);

    const used = await prisma.inviteCode.findUniqueOrThrow({ where: { id: invite.id } });
    expect(used.uses).toBe(1);
    expect(used.usedById).toBe(user.id);
  });

  it("rejects unknown, expired, used-up and wrong-email invites with the same message", async () => {
    const expired = await makeInvite({ expiresAt: new Date(Date.now() - 1000) });
    const used = await makeInvite();
    expect((await invites.registerWithInvite(person(used.code))).ok).toBe(true);
    const locked = await makeInvite({ email: "invited@test.local" });

    const before = await prisma.user.count();
    for (const attempt of [
      person("no-such-invite"),
      person(expired.code),
      person(used.code),
      person(locked.code, "someone-else@test.local"),
    ]) {
      expect(await invites.registerWithInvite(attempt)).toEqual({ ok: false, error: invites.INVALID_INVITE_MESSAGE });
    }
    expect(await prisma.user.count()).toBe(before);

    // The locked invite still works for the address it was made for.
    expect((await invites.registerWithInvite(person(locked.code, "Invited@test.local"))).ok).toBe(true);
  });

  it("rejects weak input and duplicate emails without consuming the invite", async () => {
    const invite = await makeInvite();
    expect((await invites.registerWithInvite({ ...person(invite.code), password: "short" })).ok).toBe(false);
    expect((await invites.registerWithInvite({ ...person(invite.code), email: "not-an-email" })).ok).toBe(false);
    expect((await invites.registerWithInvite(person(invite.code, "admin@test.local"))).ok).toBe(false);
    expect((await prisma.inviteCode.findUniqueOrThrow({ where: { id: invite.id } })).uses).toBe(0);
  });

  it("lets exactly one person in when several race for a single-use invite", async () => {
    const invite = await makeInvite();
    const before = await prisma.user.count();
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => invites.registerWithInvite(person(invite.code)))
    );
    const succeeded = results.filter((r) => r.status === "fulfilled" && r.value.ok);
    expect(succeeded).toHaveLength(1);
    expect(await prisma.user.count()).toBe(before + 1);
    expect((await prisma.inviteCode.findUniqueOrThrow({ where: { id: invite.id } })).uses).toBe(1);
  }, 60_000);

  it("allows a multi-use invite exactly as many times as it says", async () => {
    const invite = await makeInvite({ maxUses: 2 });
    expect((await invites.registerWithInvite(person(invite.code))).ok).toBe(true);
    expect((await invites.registerWithInvite(person(invite.code))).ok).toBe(true);
    expect((await invites.registerWithInvite(person(invite.code))).ok).toBe(false);
  });
});
