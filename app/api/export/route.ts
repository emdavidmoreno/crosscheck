import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isSubscribed } from "@/lib/billing";

export async function GET() {
  const { isAuthenticated, has } = await auth();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSubscribed(has)) {
    return NextResponse.json(
      { error: "Export requires Unique Subscription" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    exportedAt: new Date().toISOString(),
  });
}
