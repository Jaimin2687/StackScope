import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const { planName, price, cycle } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
          url: "https://checkout.stripe.com/pay/mock_sub_session_123_no_key_found",
          message: "Stripe key not found. Mock URL returned." 
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });

    // Clean price string (e.g., "₹1,499" -> 1499)
    const cleanedPrice = price ? parseFloat(String(price).replace(/[^0-9.-]+/g, "")) : 1499;
    // Stripe expects smallest currency unit (paise for INR)
    const unitAmount = Math.round(cleanedPrice * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            recurring: {
              interval: cycle === 'yearly' ? 'year' : 'month',
            },
            product_data: {
              name: `StackScope ${planName} Plan`,
              description: `Subscription for the ${planName} plan (${cycle}).`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?subscription_success=true&plan=${encodeURIComponent(planName)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?subscription_canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Subscription Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
