import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  inviteCode: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  const { name, password, inviteCode } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const invite = await prisma.inviteCode.findUnique({
    where: { code: inviteCode },
  });
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite code has expired." }, { status: 400 });
  }
  if (invite.uses >= invite.maxUses) {
    return NextResponse.json({ error: "Invite code has no uses left." }, { status: 400 });
  }
  if (invite.email && invite.email.toLowerCase() !== email) {
    return NextResponse.json(
      { error: "This invite is locked to a different email." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = randomBytes(24).toString("hex");

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash, role: "user" },
    });
    await tx.nutritionTarget.create({ data: { userId: created.id } });
    await tx.verificationToken.create({
      data: {
        token,
        userId: created.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    await tx.inviteCode.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 }, usedById: invite.uses === 0 ? created.id : undefined },
    });
    return created;
  });

  // No email service in v1 (in-app only). Return the verification URL so the
  // user can verify immediately during local/dev use.
  const verifyUrl = `/verify?token=${token}`;
  console.log(`[register] verification link for ${user.email}: ${verifyUrl}`);

  return NextResponse.json({ ok: true, verifyUrl });
}
