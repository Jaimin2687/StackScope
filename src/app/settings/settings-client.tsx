"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2, Copy } from "lucide-react";
import { saveEncryptedConfig } from "./actions";

interface Props {
  initialEmail: string;
  initialUrl?: string;
  initialKey?: string;
  initialName?: string;
  initialRazorpayAccountId?: string;
}

export function SettingsClientView({
  initialEmail,
  initialUrl = "",
  initialKey = "",
  initialName = "",
  initialRazorpayAccountId = "",
}: Props) {
  const [supabaseUrl, setSupabaseUrl] = useState(initialUrl);
  const [supabaseKey, setSupabaseKey] = useState(initialKey);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payoutName, setPayoutName] = useState(initialName || initialEmail.split("@")[0] || "");
  const [payoutAccountId, setPayoutAccountId] = useState(initialRazorpayAccountId);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<"idle" | "success" | "error">("idle");
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    // Overwrite any old localStorage garbage from previous builds so we enforce server-side state
    localStorage.removeItem('stackscope_user_supabase_config');

    const result = await saveEncryptedConfig(supabaseUrl.trim(), supabaseKey.trim());
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      console.error(result.error);
      alert("Failed to save configuration securely.");
    }
    setSaving(false);
  };

  const copySql = () => {
    const sql = `-- Run this once in your Supabase SQL Editor
create or replace function exec_sql(sql_query text)
returns void as $$
begin
  execute sql_query;
end;
$$ language plpgsql security definer;

-- Grant execution to API keys securely
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRazorpayOnboarding = async () => {
    if (!initialEmail) return;
    setPayoutLoading(true);
    setPayoutStatus("idle");
    setPayoutError(null);

    try {
      const response = await fetch("/api/razorpay/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payoutName || initialEmail.split("@")[0] || "Freelancer",
          email: initialEmail,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create Razorpay account.");
      }

      setPayoutAccountId(payload.account_id || "");
      setPayoutStatus("success");
    } catch (error: any) {
      setPayoutError(error?.message || "Failed to create Razorpay account.");
      setPayoutStatus("error");
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Profile Section */}
      <section className="space-y-6">
        <h2 className="text-lg font-medium text-white border-b border-[#222] pb-2">Profile Details</h2>
        <div className="flex flex-col gap-2 max-w-md">
          <label
            htmlFor="settings-email"
            className="text-xs text-neutral-500 font-medium uppercase tracking-wider"
          >
            Email Address
          </label>
          <input 
            id="settings-email"
            type="text" 
            disabled 
            value={initialEmail} 
            className="w-full h-10 rounded-md border border-[#333] bg-[#0a0a0a] px-3 text-sm text-neutral-400 focus:outline-none cursor-not-allowed"
          />
          <p className="text-xs text-neutral-600">Your email is managed by the central authentication provider.</p>
        </div>
      </section>

      {/* Target Supabase Section */}
      <section className="space-y-6">
        <div className="border-b border-[#222] pb-2">
          <h2 className="text-lg font-medium text-white">Target Supabase Configuration</h2>
          <p className="text-xs text-neutral-500 mt-1">Configure your own Supabase project details to enable 1-Click Deployment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-supabase-url"
                className="text-xs text-neutral-500 font-medium uppercase tracking-wider"
              >
                Project URL
              </label>
              <input 
                id="settings-supabase-url"
                type="text" 
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full h-10 rounded-md border border-[#333] bg-[#050505] px-3 text-sm text-white placeholder:text-neutral-700 focus:border-[#555] focus:outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-supabase-key"
                className="text-xs text-neutral-500 font-medium uppercase tracking-wider"
              >
                Service Role OR Anon Key
              </label>
              <input 
                id="settings-supabase-key"
                type="password" 
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGci..."
                className="w-full h-10 rounded-md border border-[#333] bg-[#050505] px-3 text-sm text-white placeholder:text-neutral-700 focus:border-[#555] focus:outline-none transition-colors"
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex w-fit items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4 text-green-600" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? "Saving securely..." : "Save Configuration"}</>}
            </button>
          </div>

          {/* Instructions Box */}
          <div className="p-5 rounded-lg border border-[#222] bg-[#0a0a0a]">
            <h3 className="text-sm font-medium text-white mb-2">Required: Enable API Deployment</h3>
            <p className="text-[13px] text-neutral-400 mb-4 leading-relaxed">
              To allow StackScope to create tables automatically, you must run this setup query once in your target Supabase Project's <strong>SQL Editor</strong>.
            </p>
            
            <div className="relative group rounded-md border border-[#333] bg-[#050505] overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={copySql}
                  className="p-1.5 bg-[#222] border border-[#333] rounded text-neutral-400 hover:text-white transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-neutral-300">
                <code>{`-- Run this once in your Supabase SQL Editor
create or replace function exec_sql(sql_query text)
returns void as $$
begin
  execute sql_query;
end;
$$ language plpgsql security definer;

-- Grant execution to API keys securely
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Razorpay Payouts Section */}
      <section className="space-y-6">
        <div className="border-b border-[#222] pb-2">
          <h2 className="text-lg font-medium text-white">Razorpay Payouts</h2>
          <p className="text-xs text-neutral-500 mt-1">Create or view your payout account for milestone split payments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="settings-razorpay-name"
                className="text-xs text-neutral-500 font-medium uppercase tracking-wider"
              >
                Payout Display Name
              </label>
              <input
                id="settings-razorpay-name"
                type="text"
                value={payoutName}
                onChange={(e) => setPayoutName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full h-10 rounded-md border border-[#333] bg-[#050505] px-3 text-sm text-white placeholder:text-neutral-700 focus:border-[#555] focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleRazorpayOnboarding}
              disabled={payoutLoading || !payoutName}
              className="flex w-fit items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {payoutLoading ? "Creating payout account..." : payoutAccountId ? "Refresh Payout Account" : "Create Razorpay Payout Account"}
            </button>

            {payoutAccountId ? (
              <p className="text-xs text-green-400">Connected Razorpay account: {payoutAccountId}</p>
            ) : (
              <p className="text-xs text-neutral-500">No payout account connected yet.</p>
            )}

            {payoutStatus === "success" && (
              <p className="text-xs text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay account created successfully.
              </p>
            )}

            {payoutStatus === "error" && payoutError && (
              <p className="text-xs text-red-400">{payoutError}</p>
            )}
          </div>

          <div className="p-5 rounded-lg border border-[#222] bg-[#0a0a0a]">
            <h3 className="text-sm font-medium text-white mb-2">How payouts work</h3>
            <p className="text-[13px] text-neutral-400 leading-relaxed">
              StackScope creates a Razorpay Route account tied to your profile. When clients pay milestones,
              92% is routed to your linked account and 8% is retained as the platform fee. You can reconnect
              or update the name anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}