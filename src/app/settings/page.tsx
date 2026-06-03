import { SideNav } from "@/components/side-nav";
import { SettingsClientView } from "./settings-client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/encryption";
import { isRoutingEnabled } from "@/lib/feature-flags";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let initialUrl = "";
  if (user?.user_metadata?.encrypted_target_url) {
    try {
      initialUrl = decrypt(user.user_metadata.encrypted_target_url);
    } catch(e) {}
  }
  
  let initialKey = "";
  if (user?.user_metadata?.encrypted_target_key) {
    try {
      // Actually we might not want to send the initial key back to the client in plain text, but for the sake of standard UX where they might want to view/edit it, we can.
      // Alternatively, we leave it blank, but since it's user's key over Next.js SSR to HTTPS, it's ok.
      initialKey = decrypt(user.user_metadata.encrypted_target_key);
    } catch(e) {}
  }

  const initialName = typeof user?.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : "";

  const initialRazorpayAccountId = typeof user?.user_metadata?.razorpay_account_id === "string"
    ? user.user_metadata.razorpay_account_id
    : "";

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <SideNav />
      <main className="flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar p-10">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-10 pb-6 border-b border-[#222]">
            <h1 className="text-2xl font-medium tracking-tight text-white mb-2">Settings</h1>
            <p className="text-neutral-500 text-sm">Manage your profile and external integrations.</p>
          </div>
          
          <SettingsClientView 
            initialEmail={user?.email || ""} 
            initialUrl={initialUrl}
            initialKey={initialKey}
            initialName={initialName}
            initialRazorpayAccountId={initialRazorpayAccountId}
            routingEnabled={isRoutingEnabled()}
          />
        </div>
      </main>
    </div>
  );
}
