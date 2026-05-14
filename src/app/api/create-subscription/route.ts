import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This subscription endpoint is deprecated. Use the Razorpay invoice flow instead.",
    },
    { status: 410 }
  );
}
