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

    const { name, email, phone } = await req.json();
    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\s+/g, "");
    if (!/^[0-9]{8,15}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Phone must be 8-15 digits." }, { status: 400 });
    }
    
    // Create a linked account for the freelancer (Razorpay Route)
    const options: any = {
      email,
      phone: normalizedPhone,
      type: "standard",
      business_type: "individual",
      legal_business_name: `${name} Freelance`,
      customer_facing_business_name: name,
      contact_name: name,
      reference_id: user.id,
      profile: {
        category: "services",
        subcategory: "freelancer",
        business_model: "Freelance software development services",
      },
    };
    
    let account: any;
    try {
      account = await razorpay.accounts.create(options);
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.status || 500;
      const description =
        err?.error?.description || err?.error?.message || err?.message || "Razorpay onboarding failed.";
      const code = err?.error?.code || err?.error?.reason || err?.code;
      const hint =
        typeof description === "string" && description.toLowerCase().includes("access denied")
          ? "Route/Partner account access is required for linked accounts. Enable Route in Razorpay or use a Route-enabled key."
          : undefined;

      return NextResponse.json(
        {
          error: description,
          code,
          hint,
        },
        { status: statusCode }
      );
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
