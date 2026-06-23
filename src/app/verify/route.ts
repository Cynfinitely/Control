import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(`${origin}/login?error=invalid_token`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.redirect(`${origin}/login?verified=1`);
}
