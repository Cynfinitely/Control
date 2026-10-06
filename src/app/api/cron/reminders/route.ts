import { NextRequest, NextResponse } from "next/server";
import { processDueReminders } from "@/lib/calendar/process-reminders";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  // Always required: this endpoint processes every user's reminders.
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueReminders();
  return NextResponse.json({ ok: true, ...result });
}
