import { SideNav } from "@/components/side-nav";
import { ScopeCard } from "@/components/scope-card";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ClientScope } from "@/lib/types";
import { Search, FolderSync, Trash2, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { getOrCreateBillingSnapshot } from "@/lib/billing";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab || 'active';
  const isBin = tab === 'bin';

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Resolve billing tier — demo users automatically get "pro" here
  let isPro = false;
  if (user) {
    try {
      const billing = await getOrCreateBillingSnapshot(supabase, user.id);
      isPro = billing.tier === "pro";
    } catch {
      // Non-fatal — default to showing the upgrade button
    }
  }

  const { data: scopes, error } = await supabase
    .from("client_scopes")
    .select("id, is_deleted, deleted_at, created_at, status, raw_brief, target_language, generated_proposal, generated_sql, updated_at")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching scopes:", JSON.stringify(error, null, 2));

  const userScopes = (scopes as ClientScope[]) || [];
  
  // Fast client-side filtering — no blocking DB mutations during SSR
  const now = new Date();
  const activeScopes: ClientScope[] = [];
  const binScopes: ClientScope[] = [];
  const expiredIds: string[] = [];

  for (const scope of userScopes) {
    if (scope.is_deleted) {
      const deletedAt = new Date(scope.deleted_at || scope.created_at);
      const diffDays = (now.getTime() - deletedAt.getTime()) / (1000 * 3600 * 24);
      
      if (diffDays > 15) {
        expiredIds.push(scope.id);
        continue; 
      }
      binScopes.push(scope);
    } else {
      activeScopes.push(scope);
    }
  }

  // Fire-and-forget: clean up expired items without blocking the page render
  if (expiredIds.length > 0) {
    supabase.from('client_scopes').delete().in('id', expiredIds).then(({ error }) => {
      if (error) console.error("[dashboard] Cleanup delete failed:", error);
    });
  }

  const displayScopes = isBin ? binScopes : activeScopes;

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <SideNav />
      
      <main className="flex-1 relative z-10 overflow-y-auto custom-scrollbar p-10">
        <div className="max-w-6xl mx-auto w-full">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#222]">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-medium tracking-tight text-white">{isBin ? "Trash Bin" : "Dashboard"}</h1>
                <p className="text-neutral-500 text-sm">
                  {isBin ? "Items here will be permanently deleted after 15 days." : "Review your generated project architectures."}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 ${!isBin ? 'bg-[#111] text-white border border-[#333]' : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Active
                </Link>
                <Link 
                  href="/dashboard?tab=bin" 
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 ${isBin ? 'bg-[#111] text-white border border-[#333]' : 'text-neutral-500 hover:text-neutral-300 border border-transparent'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Bin ({binScopes.length})
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {!isPro && (
                <a href="/pricing" className="hidden md:flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-md hover:bg-emerald-500/20 transition-colors">
                  Upgrade to Pro
                </a>
              )}
              <div className="relative group w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-500" />
                </div>
                <input
                  type="text"
                  className="w-full h-9 rounded-md border border-[#333] bg-[#0a0a0a] pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#555] transition-colors"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>

          {!isBin && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-lg font-medium text-white tracking-tight">Active Pro Modules</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-xl border border-[#222] bg-gradient-to-b from-[#0a0a0a] to-[#050505] relative overflow-hidden group hover:border-[#444] transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <svg className="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]" />
                    Razorpay Milestones API
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed relative z-10">
                    Live production of legally binding contracts and milestone checkout sessions routing to your Razorpay account.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-[#222] bg-gradient-to-b from-[#0a0a0a] to-[#050505] relative overflow-hidden group hover:border-[#444] transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                    <svg className="w-16 h-16 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_2px_rgba(245,158,11,0.5)]" />
                    GitHub Ingestion Layer
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed relative z-10">
                    Actively fetching and caching from the Octokit API to resolve monolithic complexity metrics in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {displayScopes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayScopes.map((scope) => (
                <ScopeCard key={scope.id} scope={scope} isBin={isBin} />
              ))}
            </div>
          ) : (
            <div className="mt-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-6 border border-[#222]">
                {isBin ? (
                  <Trash2 className="w-6 h-6 text-neutral-500" />
                ) : (
                  <FolderSync className="w-6 h-6 text-neutral-500" />
                )}
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {isBin ? "Bin is empty" : "No projects found"}
              </h3>
              <p className="text-neutral-500 text-sm mb-8">
                {isBin ? "When you delete a scope, it will appear here for 15 days." : "Get started by creating a new architecture scope."}
              </p>
              {!isBin && (
                <a href="/workspace" className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black shadow transition-colors hover:bg-neutral-200">
                  Create new scope
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
