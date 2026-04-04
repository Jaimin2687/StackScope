"use client";

import React from "react";
import { motion } from "framer-motion";

export function WatermelonBadge() {
  return (
    <a
      href="https://ui.watermelon.sh/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex relative z-10 font-sans"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-1.5 rounded-full border border-pink-500/30 bg-black/50 backdrop-blur-md flex items-center gap-2 overflow-hidden group shadow-[0_0_15px_rgba(236,72,153,0.15)]"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="text-[14px]">🍉</span>
        <span className="text-[12px] font-medium tracking-[0.1em] text-white/90">
          Powered by <span className="font-bold text-pink-400">ui.watermelon.sh</span>
        </span>
      </motion.div>
    </a>
  );
}
