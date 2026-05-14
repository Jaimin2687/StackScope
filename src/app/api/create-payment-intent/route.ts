import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This payment intent endpoint is deprecated. Use Razorpay payment links instead.",
    },
    { status: 410 }
  );
}
