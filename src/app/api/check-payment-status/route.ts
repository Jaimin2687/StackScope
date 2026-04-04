import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { scopeId, currentScopeObj } = await req.json();
    
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ payment_status: currentScopeObj?.payment_status || 'pending', phases: currentScopeObj?.payment_phases || [] });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
    
    let phases = currentScopeObj?.payment_phases || [];
    
    // Migrate legacy format into phase array
    if (phases.length === 0 && currentScopeObj?.payment_link_id) {
       phases.push({
           phase: 1, 
           name: "Phase 1: Project Kickoff (25%)",
           url: currentScopeObj.payment_link_url,
           id: currentScopeObj.payment_link_id,
           status: currentScopeObj.payment_status || 'pending'
       });
    }

    let updated = false;

    // Check all pending phases
    for (let p of phases) {
        if (p.status === 'pending') {
            try {
                const sessions = await stripe.checkout.sessions.list({ payment_link: p.id });
                const isPaid = sessions.data.some(s => s.payment_status === 'paid');
                if (isPaid) {
                    p.status = 'paid';
                    updated = true;
                }
            } catch (err) {
                console.error("Error looking up phase sessions:", p.id, err);
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
