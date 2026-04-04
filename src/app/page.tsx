"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, AudioWaveform, Database, Zap, Network, Code, Server, GitPullRequest, CreditCard, FileText } from "lucide-react";
import { TopNav } from "@/components/top-nav";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 600]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-white selection:text-black overflow-hidden font-sans">
      <TopNav />

      {/* LUXURY BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: y1 }} 
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[160px] mix-blend-screen" 
        />
        <motion.div 
          style={{ y: y2 }} 
          className="absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] bg-emerald-500/10 rounded-full blur-[160px] mix-blend-screen" 
        />
      </div>

      {/* 3D INFINITE GRID FLOOR */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none [perspective:1000px] select-none">
        <motion.div 
          animate={{ backgroundPosition: ["0px 0px", "0px 100px"] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[200vw] h-[80vh] [transform:rotateX(75deg)_translateY(200px)_scale(3)] opacity-[0.2]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px",
            maskImage: "radial-gradient(ellipse 50% 80% at 50% 50%, #000 20%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 50% 80% at 50% 50%, #000 20%, transparent 100%)"
          }}
        />
      </div>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <motion.section 
          style={{ scale: scaleHero, opacity: opacityHero }}
          className="pt-40 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen origin-top"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-[110px] font-medium tracking-tighter mb-8 leading-[0.95] text-center"
          >
            Architect<br />
            <span className="italic font-light text-white/50 relative">
              <span className="relative z-10">the impossible.</span>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-2xl text-white/60 mb-16 max-w-2xl mx-auto text-center font-light leading-relaxed tracking-wide"
          >
            A premium cognitive synthesizer for Principal Engineers. Speak your idea. We produce standard 3NF schemas, micro-SaaS blueprints, and instant cloud deployments.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link href="/workspace">
              <button className="h-16 px-10 rounded-full bg-white text-black text-base font-medium transition-all shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95 flex items-center gap-3">
                Establish Architecture
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </motion.section>

        {/* PREMIUM SHOWCASE SECTION */}
        <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5 relative z-20">
          <div className="text-center mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-light tracking-tight mb-4"
            >
              Enterprise-Grade Deliverables
            </motion.h2>
            <p className="text-white/50 tracking-wide font-light max-w-xl mx-auto">
              Drop the manual spec-writing. Deliver luxury interactive artifacts directly to your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ShowcaseCard 
              delay={0}
              title="Branded PDF Generation"
              subtitle="Instantly convert complex schemas and sprint timelines into beautiful, client-ready proposals wrapped in your agency's identity."
              icon={<FileText className="w-6 h-6" />}
              content={<AnimatedPDF />}
            />
            <ShowcaseCard 
              delay={0.2}
              title="Stripe SLA & Milestones"
              subtitle="Generate legally binding Service Level Agreements directly tied to Stripe Checkout links. Close deals faster."
              icon={<CreditCard className="w-6 h-6" />}
              content={<AnimatedStripe />}
            />
            <ShowcaseCard 
              delay={0.4}
              title="GitHub Intel Ingestion"
              subtitle="Pass us a Repo URL. We will autonomously crawl the codebase, decode its monolithic complexity, and generate transition architectures."
              icon={<GitPullRequest className="w-6 h-6" />}
              className="lg:col-span-2 min-h-[300px]"
              content={<AnimatedTerminal />}
            />
          </div>
        </section>

        {/* CORE PLATFORM FEATURES */}
        <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
            {[
              {
                icon: AudioWaveform,
                title: "Voice-To-Architecture",
                desc: "Don't type it out. Speak your systems. We strip the noise and map out exact technical requirements."
              },
              {
                icon: Database,
                title: "3NF Normalized SQL",
                desc: "Forget flat arrays. We enforce strict relational paradigms, producing perfectly normalized structures."
              },
              {
                icon: Zap,
                title: "1-Click DB Rollout",
                desc: "Bring your Supabase credentials. We safely execute Data Definition queries instantly across environments."
              },
              {
                icon: Network,
                title: "Mermaid Diagnostics",
                desc: "Visualize data flows instantly with auto-generated Mermaid.js architecture diagrams."
              },
              {
                icon: Code,
                title: "Decoupled Paradigms",
                desc: "We strictly generate architectures utilizing segmented Front-End and Back-End standards (Next + Express)."
              },
              {
                icon: Server,
                title: "AES-256 Encryption",
                desc: "Server-side encryption guarantees your target databases are securely attached to your profile."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-white/0 group-hover:bg-white/[0.02] rounded-2xl transition-colors duration-500" />
                <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white group-hover:scale-110 transition-all duration-500 relative z-10">
                  <feature.icon className="w-5 h-5 text-white/50 group-hover:text-black transition-colors duration-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-3 tracking-wide relative z-10">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed font-light text-sm relative z-10">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA FOOTER */}
        <section className="py-40 relative flex items-center justify-center border-t border-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center relative z-10 px-6"
          >
            <h2 className="text-4xl md:text-6xl font-light mb-8">Ready to skip the boilerplate?</h2>
            <Link href="/workspace">
              <button className="h-14 px-8 rounded-full bg-white text-black font-medium transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                Initialize StackScope Mode
              </button>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#020202] py-12 relative z-30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-[10px]">S</div>
            <span>StackScope AI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}

// --------------------------------------------------------------------------------------
// PREMIUM SHOWCASE CARD (STATIC GLASSMORPHISM)
// --------------------------------------------------------------------------------------
function ShowcaseCard({ title, subtitle, icon, delay, content, className = "" }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col ${className}`}
    >
      <div className="h-full w-full rounded-[2rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent relative group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
        
        <div className="h-full w-full bg-[#070707]/90 backdrop-blur-3xl rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-xl">
          <div className="flex items-center gap-4 mb-6 relative z-10 flex-none">
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-emerald-400 shrink-0">
              {icon}
            </div>
            <h3 className="text-2xl font-light tracking-wide">{title}</h3>
          </div>
          <p className="text-white/50 font-light leading-relaxed mb-8 flex-none relative z-10">
            {subtitle}
          </p>
          
          {/* The Inner Box */}
          <div className="w-full flex-1 min-h-[220px] rounded-2xl overflow-hidden relative border border-white/5 bg-[#000000] shadow-inner flex flex-col">
            {content}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --------------------------------------------------------------------------------------
// CUSTOM ANIMATED INNER CARDS
// --------------------------------------------------------------------------------------

const AnimatedPDF = () => (
  <div className="relative w-full h-full flex p-6 items-center justify-center overflow-hidden min-h-[220px]">
    <motion.div 
      animate={{ y: [-5, 5, -5], rotateZ: [-2, 2, -2] }} 
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="w-40 h-48 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col p-4 relative z-10"
    >
      <div className="w-20 h-2 bg-emerald-500/80 mb-4 rounded-sm" />
      <div className="w-full h-1 bg-white/20 mb-2 rounded-sm" />
      <div className="w-3/4 h-1 bg-white/20 mb-6 rounded-sm" />
      <div className="w-full flex-1 border border-white/10 bg-[#050505] rounded relative overflow-hidden flex flex-col p-2 gap-2">
         <div className="w-full h-1.5 bg-indigo-500/40 rounded-sm" />
         <div className="w-full h-1.5 bg-white/10 rounded-sm" />
         <div className="w-4/5 h-1.5 bg-white/10 rounded-sm" />
      </div>
    </motion.div>
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute w-32 h-32 bg-emerald-500/20 blur-[50px] z-0" 
    />
  </div>
);

const AnimatedStripe = () => (
  <div className="relative w-full h-full flex items-center justify-center p-6 overflow-hidden min-h-[220px]">
     <motion.div 
        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        className="absolute w-32 h-32 bg-indigo-500/30 rounded-full blur-md"
     />
     <motion.div 
      whileHover={{ scale: 1.05 }}
      className="relative z-10 flex flex-col items-center gap-4 p-6 bg-[#0a0a0a] border border-indigo-500/30 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.2)] w-full max-w-[240px]"
     >
        <div className="flex items-center gap-3 w-full border-b border-white/5 pb-4">
           <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center shrink-0 shadow-lg">
               <CreditCard className="w-5 h-5 text-white" />
           </div>
           <div className="flex-1">
              <div className="text-white text-[13px] font-medium">Pro Escrow</div>
              <div className="text-white/40 text-[11px]">$1,499.00 USD</div>
           </div>
        </div>
        <button className="w-full py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded shadow-lg transition-colors flex items-center justify-center gap-2">
          Pay with Link
        </button>
     </motion.div>
  </div>
);

const AnimatedTerminal = () => {
  return (
    <div className="relative w-full h-full p-6 flex flex-col overflow-hidden bg-[#030303] min-h-[220px]">
       <div className="flex gap-2 mb-6">
         <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
         <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
         <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
       </div>
       <div className="font-mono text-[13px] text-white/80 leading-relaxed flex flex-col gap-2 relative z-10">
         <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}>
           <span className="text-emerald-400">~</span> <span className="text-white">stackscope ingest</span> <span className="text-indigo-400">org/monolith</span>
         </motion.div>
         <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="text-neutral-500 border-l-2 border-white/10 pl-3 ml-1">
            Analyzing 344 files...
         </motion.div>
         <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }} className="text-neutral-500 border-l-2 border-white/10 pl-3 ml-1">
            Extracting database relations...
         </motion.div>
         <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }} className="text-indigo-400 border-l-2 border-indigo-400/30 pl-3 ml-1">
            Mapping to Next.js API Routes.
         </motion.div>
         <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2.8 }} className="text-emerald-400 font-medium tracking-wide flex items-center gap-2 mt-2">
           <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
           Architecture generated.
         </motion.div>
       </div>
       
       <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
    </div>
  );
};
