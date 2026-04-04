import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payment_link_id, scopeId, currentScopeObj } = await req.json();
    
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ payment_status: currentScopeObj?.payment_status || 'pending' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
    
    // Find all sessions for this payment link
    const sessions = await stripe.checkout.sessions.list({ payment_link: payment_link_id });
    
    // Check if any is paid
    const isPaid = sessions.data.some(s => s.payment_status === 'paid');
    
    if (isPaid && currentScopeObj?.payment_status !== 'paid') {
      const updatedProposal = {
        ...currentScopeObj,
        payment_status: 'paid'
      };
      
      const { error } = await supabase.from("client_scopes").update({
        generated_proposal: updatedProposal
      }).eq("id", scopeId).eq("user_id", user.id);
      
      if (error) throw new Error(error.message);
      
      return NextResponse.json({ payment_status: 'paid' });
    }
    
    return NextResponse.json({ payment_status: currentScopeObj?.payment_status || 'pending' });
  } catch (err: any) {
    console.error("Check status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
