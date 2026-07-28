import { NextRequest, NextResponse } from "next/server";
import { processDueReminders } from "@/lib/calendar/process-reminders";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const result = await processDueReminders();
  return NextResponse.json({ ok: true, ...result });
}
