import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured in the environment." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
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
    
    let account: any;
    try {
      account = await razorpay.accounts.create(options);
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.status || 500;
      const description =
        err?.error?.description || err?.error?.message || err?.message || "Razorpay onboarding failed.";
      const code = err?.error?.code || err?.error?.reason || err?.code;

      return NextResponse.json(
        {
          error: description,
          code,
        },
        { status: statusCode }
      );
    }

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
    return NextResponse.json(
      { error: error.message || "Razorpay onboarding failed." },
      { status: 500 }
    );
  }
}
