import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(req: Request) {
  try {
        if (!isJsonRequest(req)) {
            return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
        }

        if (!isSameOrigin(req)) {
            return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
        }

        const ip = getClientIp(req);
        const limiter = rateLimit({ key: `check-payment-status:${ip}`, limit: 20, windowMs: 60_000 });
        if (!limiter.allowed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { scopeId, currentScopeObj } = await req.json();

        if (!scopeId) {
            return NextResponse.json({ error: "Missing scopeId" }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ payment_status: currentScopeObj?.payment_status || "pending", phases: currentScopeObj?.payment_phases || [] });
        }
    
    let phases = currentScopeObj?.payment_phases || [];

    let updated = false;

    // Check all pending phases
    for (let p of phases) {
            if (p.status === "pending") {
                try {
                    const linkId = p.pl_id || p.id;
                    if (!linkId) continue;
                    const paymentLink: any = await razorpay.paymentLink.fetch(linkId);
                    const status = String(paymentLink?.status || "").toLowerCase();
                    if (status === "paid") {
                        p.status = "paid";
                        updated = true;
                    } else if (["failed", "cancelled", "expired"].includes(status)) {
                        p.status = "failed";
                        updated = true;
                    }
                } catch (err) {
                    console.error("Error looking up Razorpay payment link:", p.pl_id || p.id, err);
                }
            }
    }

    if (updated) {
        const latestPhase = phases[phases.length - 1];
        const overallStatus = latestPhase.status;

        const updatedProposal = {
            ...currentScopeObj,
            payment_phases: phases,
            payment_status: overallStatus // keep legacy field in sync roughly
        };
        
        const { error } = await supabase.from("client_scopes").update({
            generated_proposal: updatedProposal
        }).eq("id", scopeId).eq("user_id", user.id);
        
        if (error) throw new Error(error.message);
        
        return NextResponse.json({ payment_status: overallStatus, phases });
    }
    
    return NextResponse.json({ 
      payment_status: currentScopeObj?.payment_status || 'pending',
      phases 
    });
  } catch (err: any) {
    console.error("Check status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
