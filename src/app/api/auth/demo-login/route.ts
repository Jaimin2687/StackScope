import { NextResponse } from "next/server";

/**
 * POST /api/auth/demo-login — RETIRED
 *
 * The demo-login flow has been removed. Free-tier users receive
 * 4 scope generations per month with unlimited edits natively.
 *
 * Returns 410 Gone so any stale clients fail with a clear signal
 * rather than a confusing 404 or 500.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Demo mode has been removed. Please create a free account to get started." },
    { status: 410 }
  );
}
