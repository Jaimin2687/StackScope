import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, summary, price, scopeId, currentScopeObj } = body;
    
    let basePriceValue = 1499;
    if (price && typeof price === 'number') {
      basePriceValue = price;
    } else if (typeof price === 'string') {
      const cleaned = String(price).replace(/[^0-9.-]+/g, "");
      if (cleaned) basePriceValue = parseFloat(cleaned);
    }

    const upfrontAmount = Math.round(basePriceValue * 0.25 * 100);
    
    // Migrate old scope formats to multi-phase array
    let phases = currentScopeObj?.payment_phases || [];
    if (phases.length === 0 && currentScopeObj?.payment_link_id) {
       phases.push({
           phase: 1, 
           name: "Phase 1: Project Kickoff (25%)",
           url: currentScopeObj.payment_link_url,
           id: currentScopeObj.payment_link_id,
           status: currentScopeObj.payment_status || 'pending'
       });
    }

    const lastPhase = phases[phases.length - 1];
    
    // If the latest phase is still pending, just return it so they can pay it
    if (lastPhase && lastPhase.status === 'pending') {
        return NextResponse.json({ 
            url: lastPhase.url, 
            id: lastPhase.id, 
            payment_status: lastPhase.status, 
            phases 
        });
    }

    const nextPhaseNumber = phases.length + 1;
    if (nextPhaseNumber > 4) {
        return NextResponse.json({ phases, message: "All phases generated/paid" });
    }

    const phaseNames = [
        "Phase 1: Project Kickoff (25%)",
        "Phase 2: UI/UX & Alpha Build (25%)",
        "Phase 3: Core Logic & Beta (25%)",
        "Phase 4: Final Delivery & Launch (25%)"
    ];
    
    const nextPhaseName = phaseNames[nextPhaseNumber - 1];

    if (!process.env.STRIPE_SECRET_KEY) {
        const mockLink = { 
            url: `https://buy.stripe.com/mock_link_phase_${nextPhaseNumber}`,
            id: `plink_mock_${nextPhaseNumber}`,
            payment_status: "pending"
        };
        return NextResponse.json({ ...mockLink, phases: [...phases, { phase: nextPhaseNumber, name: nextPhaseName, ...mockLink }] });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any }); 
    const safeTitle = (title || 'Architecture Build').substring(0, 200);

    const product = await stripe.products.create({ 
        name: `${nextPhaseName}: ${safeTitle}` 
    });
    
    const stripePrice = await stripe.prices.create({ 
        product: product.id, 
        unit_amount: upfrontAmount, 
        currency: 'inr' 
    });

    const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        metadata: { scopeId, phase: nextPhaseNumber }
    });

    const newPhase = {
        phase: nextPhaseNumber,
        name: nextPhaseName,
        url: paymentLink.url,
        id: paymentLink.id,
        status: 'pending'
    };
    
    const newPhasesArray = [...phases, newPhase];

    // Save to database
    const updatedProposal = {
        ...currentScopeObj,
        payment_phases: newPhasesArray,
        // Legacy fallback 
        payment_link_id: paymentLink.id,
        payment_link_url: paymentLink.url,
        payment_status: 'pending'
    };

    const { error } = await supabase.from("client_scopes").update({
        generated_proposal: updatedProposal
    }).eq("id", scopeId).eq("user_id", user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ 
        url: paymentLink.url, 
        id: paymentLink.id, 
        payment_status: 'pending',
        phases: newPhasesArray
    });
  } catch (err: any) {
    console.error("Stripe Link Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
