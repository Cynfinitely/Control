import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

/** Invites expire: 7 days unless the admin picks another length, never more than 30. */
export const INVITE_DEFAULT_DAYS = 7;
export const INVITE_MAX_DAYS = 30;

/** Shown for every unusable invite, so the response never says which check failed. */
export const INVALID_INVITE_MESSAGE = "This invite link is not valid or has expired. Ask for a new one.";

/** 192 random bits, URL-safe. The code is the only secret an invited person needs. */
export function generateInviteCode(): string {
  return randomBytes(24).toString("base64url");
}

export function inviteExpiry(days: number, from = new Date()): Date {
  const clamped = Math.min(INVITE_MAX_DAYS, Math.max(1, Math.round(days) || INVITE_DEFAULT_DAYS));
  return new Date(from.getTime() + clamped * 24 * 60 * 60 * 1000);
}

export type InviteStatus = "active" | "expired" | "used";

export function inviteStatus(
  invite: { uses: number; maxUses: number; expiresAt: Date | null },
  now = new Date()
): InviteStatus {
  if (invite.expiresAt && invite.expiresAt <= now) return "expired";
  if (invite.uses >= invite.maxUses) return "used";
  return "active";
}

/** Returns the invite when it can still be used, otherwise null. */
export async function findUsableInvite(code: string | null | undefined) {
  if (!code) return null;
  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite || inviteStatus(invite) !== "active") return null;
  return invite;
}

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(100),
  inviteCode: z.string().min(1).max(200),
});

export type RegistrationResult = { ok: true; userId: string } | { ok: false; error: string };

class InviteUnavailable extends Error {}

/**
 * Creates an account from an invite. The invite is consumed in the same
 * transaction with a conditional update, so two people racing on the last use
 * cannot both get in.
 *
 * The new account starts with nothing but its own default nutrition target.
 */
export async function registerWithInvite(input: unknown): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check your details. The password must be at least 8 characters." };
  }
  const { name, password, inviteCode } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const invite = await findUsableInvite(inviteCode);
  if (!invite) return { ok: false, error: INVALID_INVITE_MESSAGE };
  if (invite.email && invite.email.toLowerCase() !== email) {
    return { ok: false, error: INVALID_INVITE_MESSAGE };
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, error: "An account with this email already exists. Sign in instead." };

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const claimed = await tx.inviteCode.updateMany({
        where: {
          id: invite.id,
          uses: { lt: invite.maxUses },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { uses: { increment: 1 } },
      });
      if (claimed.count !== 1) throw new InviteUnavailable();

      // There is no email service, so the invite itself is the proof that this
      // person was let in. The column stays so real verification can be added.
      const created = await tx.user.create({
        data: { name, email, passwordHash, role: "user", emailVerifiedAt: now },
      });
      await tx.nutritionTarget.create({ data: { userId: created.id } });
      await tx.inviteCode.updateMany({
        where: { id: invite.id, usedById: null },
        data: { usedById: created.id },
      });
      return created;
    });
    return { ok: true, userId: user.id };
  } catch (error) {
    if (error instanceof InviteUnavailable) return { ok: false, error: INVALID_INVITE_MESSAGE };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "An account with this email already exists. Sign in instead." };
    }
    throw error;
  }
}
