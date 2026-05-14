import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy",
});

export async function POST(req: Request) {
  try {
    const { title, summary, price, scopeId, currentScopeObj, connectedAccountId } = await req.json();

    if (!price || isNaN(price)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Standardize total amount in paise (INR)
    const amountInPaise = Math.round(Number(price) * 100);
    
    if (!currentScopeObj || typeof currentScopeObj !== "object") {
      return NextResponse.json({ error: "Missing scope details" }, { status: 400 });
    }

    // Use current phases or init new
    let phases = currentScopeObj?.payment_phases || [];
    if (!Array.isArray(phases)) phases = [];

    // Milestone logic based on phases length
    const phaseNames = ["Kickoff / Deposit", "Alpha Delivery", "Beta Delivery", "Final Handover"];
    const phaseIndex = phases.length;

    if (phaseIndex >= 4) {
      return NextResponse.json({ error: "All 4 phases have already been mapped." }, { status: 400 });
    }

    const currentPhaseName = phaseNames[phaseIndex];
    let milestoneAmountPaise = amountInPaise;

    // Typical SaaS setup: phase split e.g., 30% / 30% / 20% / 20%
    if (phaseIndex === 0) milestoneAmountPaise = Math.round(amountInPaise * 0.3); // 30% kickoff
    else if (phaseIndex === 1) milestoneAmountPaise = Math.round(amountInPaise * 0.3); // 30% alpha
    else if (phaseIndex === 2) milestoneAmountPaise = Math.round(amountInPaise * 0.2); // 20% beta
    else milestoneAmountPaise = amountInPaise - (Math.round(amountInPaise * 0.3) * 2 + Math.round(amountInPaise * 0.2));

    const milestonePlatformFeePaise = Math.round(milestoneAmountPaise * 0.08); // 8% Application Fee
    const milestoneFreelancerPaise = milestoneAmountPaise - milestonePlatformFeePaise; // 92% to freelancer

    // Create the transfer configuration specifically for Razorpay Route
    const orderOptions: any = {
      amount: milestoneAmountPaise,
      currency: "INR",
      receipt: scopeId,
      notes: { phase: currentPhaseName },
    };

    // If freelancer account linked, setup split
    const freelancerAcc = connectedAccountId || currentScopeObj?.freelancer_razorpay_account_id;
    if (freelancerAcc) {
      orderOptions.transfers = [
        {
          account: freelancerAcc,
          amount: milestoneFreelancerPaise,
          currency: "INR",
          notes: { purpose: "Freelancer payout" },
          on_hold: false
        }
      ];
    }

    const order = await razorpay.orders.create(orderOptions);

    // Create Payment Link assigned to this order
    const paymentLink = await razorpay.paymentLink.create({
      amount: milestoneAmountPaise,
      currency: "INR",
      accept_partial: false,
      description: `${title} - ${currentPhaseName}`,
      reference_id: `${scopeId}-phase-${phaseIndex + 1}`,
      customer: {
        name: "Client",
        email: "client@example.com",
        contact: "+919999999999"
      },
      notes: {
        order_id: order.id,
      },
    });

    const newPhase = {
      phase: phaseIndex + 1,
      name: currentPhaseName,
      url: paymentLink.short_url,
      pl_id: paymentLink.id,
      order_id: order.id,
      amount: milestoneAmountPaise / 100, // stored in INR
      status: "pending",
      split: {
        freelancer_amount: milestoneFreelancerPaise / 100,
        platform_fee: milestonePlatformFeePaise / 100
      }
    };

    phases.push(newPhase);

    // Update in Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedScope = {
      ...currentScopeObj,
      payment_phases: phases,
      freelancer_razorpay_account_id: freelancerAcc || null
    };

    const { error: dbError } = await supabase
      .from("client_scopes")
      .update({ generated_proposal: updatedScope })
      .eq("id", scopeId)
      .eq("user_id", user.id);

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      url: paymentLink.short_url,
      phases,
    });
  } catch (error: any) {
    console.error("Razorpay Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
