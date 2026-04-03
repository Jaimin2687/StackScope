"use client";

import { AuthForm } from "@/components/auth-form";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center bg-black text-white selection:bg-white/30">
      
      {/* Absolute minimal background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative z-10 px-6"
      >
        <AuthForm />
        
        <div className="mt-12 flex justify-center gap-6 text-[13px] text-neutral-600">
          <a href="#" className="hover:text-neutral-300 transition-colors">Documentation</a>
          <a href="#" className="hover:text-neutral-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-neutral-300 transition-colors">Terms</a>
        </div>
      </motion.div>
    </main>
  );
}
