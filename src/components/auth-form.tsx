"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CopyPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
        setError("Check your email for the confirmation link.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[360px] mx-auto p-8 rounded-xl border border-[#222] bg-[#0a0a0a] shadow-2xl relative overflow-hidden">
      
      {/* Super subtle background glow */}
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
            className="flex h-10 w-full rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#555] transition-colors"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-400">Password</label>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="flex h-10 w-full rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#555] transition-colors"
          />
        </div>

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

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
        </motion.button>
      </form>

      <div className="mt-6 text-center text-[13px] text-neutral-500 relative z-10">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          type="button" 
          onClick={() => { setIsLogin(!isLogin); setError(null); }}
          className="text-white hover:underline transition-colors"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
