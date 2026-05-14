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
    const { name, email } = await req.json();
    
    // Create a linked account for the freelancer (Razorpay Route)
    const options: any = {
      name: name,
      email: email,
      tnc_accepted: true,
      account_details: {
        business_name: `${name} Freelance`,
        business_type: "individual"
      }
    };
    
    const account: any = await razorpay.accounts.create(options);

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

    await supabase.auth.updateUser({
      data: { razorpay_account_id: account.id }
    });

    return NextResponse.json({ success: true, account_id: account.id });
  } catch (error: any) {
    console.error("Razorpay Onboarding Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
