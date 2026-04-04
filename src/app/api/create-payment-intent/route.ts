import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { title, summary, price, estimates } = await req.json();
    
    // Parse the total price. Try base_cost_inr first, then cost_estimate_inr, fallback to 1499.
    let basePriceValue = 1499; // fallback
    
    if (price && typeof price === 'number') {
      basePriceValue = price;
    } else if (estimates?.base_cost_inr && typeof estimates.base_cost_inr === 'number') {
      basePriceValue = estimates.base_cost_inr;
    } else if (estimates?.cost_estimate_inr) {
      const cleaned = String(estimates.cost_estimate_inr).replace(/[^0-9.-]+/g, "");
      if (cleaned) {
        basePriceValue = parseFloat(cleaned);
      }
    }

    const upfrontAmount = Math.round(basePriceValue * 0.25 * 100);
    
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ 
            error: "Stripe Secret Key not found in environment variables." 
        }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any }); 

    const safeTitle = (title || 'Architecture Build').substring(0, 200);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: upfrontAmount,
      currency: "inr",
      description: `Phase 1 Milestone (25% Upfront): ${safeTitle}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: upfrontAmount
    });
  } catch (err: any) {
    console.error("Stripe Payment Intent Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
