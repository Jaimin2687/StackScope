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
      // Clean string like "₹10,00,000" or "$ 15000"
      const cleaned = String(estimates.cost_estimate_inr).replace(/[^0-9.-]+/g, "");
      if (cleaned) {
        basePriceValue = parseFloat(cleaned);
      }
    }

    // Since Stripe requires an integer in the smallest currency unit (paise for INR), 
    // and we want 25% upfront milestone:
    const upfrontAmount = Math.round(basePriceValue * 0.25 * 100);
    
    if (!process.env.STRIPE_SECRET_KEY) {
        // Fallback for demonstration when keys aren't set in the AI environment
        return NextResponse.json({ 
            url: "https://checkout.stripe.com/pay/mock_session_123_no_key_found",
            message: "Stripe key not found natively. Mock URL returned." 
        });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any }); // Changed to stable TS known version
    
    // Safely truncate strings for Stripe limits
    const safeTitle = (title || 'Architecture Build').substring(0, 200);
    const safeSummary = (summary || 'Automated StackScope Service Level Agreement binding.').substring(0, 450);

    const session = await stripe.checkout.sessions.create({
        // @ts-ignore
        ui_mode: 'embedded',
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'inr',
                product_data: { 
                    name: `Phase 1 Milestone (25% Upfront): ${safeTitle}`,
                    description: safeSummary,
                },
                unit_amount: upfrontAmount,
            },
            quantity: 1,
        }],
        mode: 'payment',
        return_url: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
