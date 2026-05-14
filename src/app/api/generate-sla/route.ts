import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This SLA checkout endpoint is deprecated. Use Razorpay milestone links instead.",
    },
    { status: 410 }
  );
}
