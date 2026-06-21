import { SideNav } from "@/components/side-nav";
import { TeamClientView } from "./team-client";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Team Management — StackScope",
  description: "Invite and manage your agency team members.",
};

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Look up the user's active org membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("invited_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id ?? undefined;

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <SideNav />
      <main className="flex-1 min-h-0 relative z-10 overflow-y-auto custom-scrollbar p-10">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-10 pb-6 border-b border-[#222]">
            <h1 className="text-2xl font-medium tracking-tight text-white mb-2">Team</h1>
            <p className="text-neutral-500 text-sm">
              Manage your organization members and pending invitations.
            </p>
          </div>

          <TeamClientView initialOrgId={orgId} />
        </div>
      </main>
    </div>
  );
}
