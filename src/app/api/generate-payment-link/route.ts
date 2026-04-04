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
    
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ 
            url: "https://buy.stripe.com/mock_link_123",
            id: "plink_mock_123",
            payment_status: "pending"
        });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any }); 
    const safeTitle = (title || 'Architecture Build').substring(0, 200);

    const product = await stripe.products.create({ 
        name: `Phase 1 Milestone (25% Upfront): ${safeTitle}` 
    });
    
    const stripePrice = await stripe.prices.create({ 
        product: product.id, 
        unit_amount: upfrontAmount, 
        currency: 'inr' 
    });

    const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        metadata: { scopeId }
    });

    // Save to database
    const updatedProposal = {
        ...currentScopeObj,
        payment_link_id: paymentLink.id,
        payment_link_url: paymentLink.url,
        payment_status: 'pending'
    };

    const { error } = await supabase.from("client_scopes").update({
        generated_proposal: updatedProposal
    }).eq("id", scopeId).eq("user_id", user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ url: paymentLink.url, id: paymentLink.id, payment_status: 'pending' });
  } catch (err: any) {
    console.error("Stripe Link Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
