"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const supabase = createClient();

      if (isLogin) {
        // ── Sign In ───────────────────────────────────────────────────────
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.refresh();
        router.replace("/dashboard");
      } else {
        // ── Sign Up (server-side, auto-confirms email) ────────────────────
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload?.error || "Failed to create account.");
        }

        if (payload.requiresLogin) {
          // Account created but auto sign-in failed — show success and switch to login
          setSuccess(payload.message || "Account created! Please sign in.");
          setIsLogin(true);
        } else {
          // Fully signed in — go to dashboard
          router.refresh();
          router.replace("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    clearMessages();

    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST" });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Demo login failed.");
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: payload.token_hash,
        type: "magiclink",
      });

      if (error) throw error;

      router.refresh();
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Could not start demo session. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  const isDisabled = loading || demoLoading;

  return (
    <div className="w-full max-w-[360px] mx-auto p-8 rounded-xl border border-[#222] bg-[#0a0a0a] shadow-2xl relative overflow-hidden">

      {/* Subtle background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center text-center mb-8">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <div className="w-4 h-4 bg-black rounded-sm" />
        </div>
        <h1 className="text-xl font-medium tracking-tight text-white mb-2">
          {isLogin ? "Sign in to StackScope" : "Create your account"}
        </h1>
        <p className="text-sm text-neutral-400">
          Enter your details below to continue.
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4 relative z-10">
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            disabled={isDisabled}
            className="flex h-10 w-full rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#555] transition-colors disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isDisabled}
            minLength={6}
            className="flex h-10 w-full rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#555] transition-colors disabled:opacity-50"
          />
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[13px] text-red-400 text-center py-1"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-1.5 text-[13px] text-emerald-400 text-center py-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isDisabled}
          className="w-full h-10 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors mt-2 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Sign In"
            : "Create Account"}
        </motion.button>
      </form>

      {/* Demo login */}
      <div className="relative z-10 flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#222]" />
        <span className="text-[11px] text-neutral-600 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-[#222]" />
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleDemoLogin}
        disabled={isDisabled}
        className="relative z-10 w-full h-10 flex items-center justify-center gap-2 rounded-md border border-[#333] bg-[#111] text-sm font-medium text-neutral-300 hover:border-[#555] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className={`w-4 h-4 text-amber-400 ${demoLoading ? "animate-pulse" : ""}`} />
        {demoLoading ? "Starting demo..." : "Try Demo — instant access"}
      </motion.button>

      <div className="mt-6 text-center text-[13px] text-neutral-500 relative z-10">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setIsLogin(!isLogin); clearMessages(); }}
          className="text-white hover:underline transition-colors"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
