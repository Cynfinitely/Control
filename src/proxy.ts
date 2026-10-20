import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import type { NextFetchEvent } from "next/server";

// Next.js 16 needs a statically visible function export, so wrap next-auth's
// default handler instead of re-exporting it.
export function proxy(req: NextRequestWithAuth, event: NextFetchEvent) {
  return withAuth(req, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
