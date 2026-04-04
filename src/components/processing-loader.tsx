"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function ProcessingLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
           className="w-12 h-12 rounded-full border-t-2 border-white opacity-20"
        />
        <motion.div
           animate={{ rotate: -360 }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 w-12 h-12 rounded-full border-b-2 border-white opacity-40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-sm font-medium text-white tracking-wide">Synthesizing Architecture</h3>
        <p className="text-[12px] text-neutral-500">Processing input context and structuring schema...</p>
      </div>

      <div className="w-48 h-1 bg-[#111] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 20, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
