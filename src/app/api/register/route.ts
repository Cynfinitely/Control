import { NextResponse } from "next/server";
import { registerWithInvite } from "@/lib/invites";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await registerWithInvite(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
