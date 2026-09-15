import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotificationFeed } from "@/lib/queries/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const feed = await getNotificationFeed(session.user.id);
  return NextResponse.json(feed);
}
