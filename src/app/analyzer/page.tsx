"use client";

import { useState } from "react";
import { SideNav } from "@/components/side-nav";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Search, AlertTriangle, CheckCircle2, Lock, ArrowRight, Zap, CloudOff, FileCode, RefreshCw, Activity, GitPullRequest } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Input, Badge, Card } from "@/components/ui/watermelon";

export default function AnalyzerPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setIsScanning(true);
    setResults(null);
    
    try {
      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        setIsScanning(false);
        return;
      }
      
      setTimeout(() => {
        setResults({
          ...data,
          issues: data.issues.map((i: any) => ({
            ...i,
            icon: i.icon === "AlertTriangle" ? AlertTriangle : i.icon === "Zap" ? Zap : i.icon === "CheckCircle2" ? CheckCircle2 : Lock
          }))
        });
        setIsScanning(false);
      }, 1800);

    } catch (err) {
      alert("Failed to ingest Github repo.");
      setIsScanning(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden selection:bg-indigo-500/30">
      {/* 3D Premium Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:perspective(1000px)_rotateX(60deg)_translateY(-200px)_translateZ(-200px)] opacity-30 pointer-events-none" />

      <SideNav />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-10 relative z-10">
        <div className="max-w-5xl mx-auto w-full pt-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
                <GitBranch className="w-6 h-6 text-indigo-400" />
              </div>
              Deep-Scope Analyzer
            </h1>
            <p className="text-neutral-400 mt-4 text-lg max-w-2xl leading-relaxed">
              Ingest any GitHub repository instantly. Our engine maps technical debt, architectural complexity, and formulates a modernization blueprint.
            </p>
          </motion.div>

          {/* ── Watermelon UI: Card wraps the repo URL form ── */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleScan}
          >
            <Card className="p-8 mb-8 relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-black shadow-2xl">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <label className="block text-sm font-medium text-indigo-200 mb-3 uppercase tracking-wider">
                  Target Repository URL
                </label>
                <div className="flex gap-4">
                  {/* ── Watermelon UI: Input for repo URL ── */}
                  <Input
                    type="text"
                    placeholder="https://github.com/username/project"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="flex-1 text-lg px-5 py-4 h-auto rounded-xl border-[#333] focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {/* ── Watermelon UI: Button with motion for Analyze CTA ── */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isScanning || !repoUrl}
                    className="rounded-xl px-8 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.5)]"
                  >
                    {isScanning ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <>
                        <Search className="w-5 h-5" /> Analyze Base
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.form>

          <AnimatePresence mode="wait">
            {isScanning && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-16 border border-indigo-500/20 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-transparent flex flex-col items-center justify-center text-center gap-6 shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)] relative overflow-hidden"
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bg-indigo-500/20 w-32 h-32 rounded-full blur-[50px]" />
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-[#222] border-t-indigo-500 rounded-full animate-spin" />
                  <Activity className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">Ingesting Architecture...</h3>
                  <p className="text-indigo-200/70 text-lg">Running deep analysis on dependency graph & debt vectors.</p>
                </div>
              </motion.div>
            )}

            {results && !isScanning && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ staggerChildren: 0.1 }} 
                className="space-y-8"
              >
                {/* ── Watermelon UI: Card wraps the Pulse Check + Structure Intelligence block ── */}
                <Card className={`p-8 md:p-10 flex flex-col md:flex-row gap-10 md:gap-16 relative overflow-hidden shadow-2xl
                  ${results.healthScore.includes('A') ? 'border-emerald-500/30' : 'border-red-500/30'}
                  bg-gradient-to-b from-[#0a0a0a] to-black`}
                >
                  <div className={`absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-br ${results.healthScore.includes('A') ? 'from-emerald-500/10' : 'from-red-500/10'} to-transparent rounded-xl`} />
                  
                  {/* Left: Pulse Check (Health Grade) */}
                  <div className="md:w-1/3 flex flex-col items-center justify-center text-center relative z-10 md:border-r border-[#222] md:pr-10">
                    <div className="w-24 h-24 rounded-full bg-black border border-[#222] flex items-center justify-center mb-6 relative">
                      <div className={`absolute inset-0 rounded-full blur-xl ${results.healthScore.includes('A') ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />
                      <span className={`text-5xl font-black relative z-10 ${results.healthScore.includes('A') ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
                        {results.healthScore}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold tracking-wide text-white mb-3">Pulse Check</h4>
                    {/* ── Watermelon UI: Badge for status text pill ── */}
                    <Badge
                      tone="primary"
                      className={`px-5 py-2 text-sm font-medium rounded-full ${
                        results.healthScore.includes('A')
                          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      {results.statusText}
                    </Badge>
                    {/* ── Watermelon UI: Badge for primary language chip ── */}
                    {results.repoDetails?.primaryLanguage && (
                      <Badge tone="secondary" className="mt-3 text-xs">
                        {results.repoDetails.primaryLanguage}
                      </Badge>
                    )}
                  </div>

                  {/* Right: Structure Intelligence */}
                  <div className="md:w-2/3 relative z-10 space-y-6">
                    <h3 className="font-semibold text-white/90 flex items-center gap-3 text-xl">
                      <CloudOff className="w-6 h-6 text-indigo-400" /> Structure Intelligence
                    </h3>
                    <div className="space-y-4">
                      {results.issues.map((issue: any, i: number) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          key={i}
                          className="flex items-start gap-5 bg-[#050505] p-5 rounded-xl border border-[#222] hover:border-[#444] transition-colors"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-black border border-[#333] flex items-center justify-center flex-shrink-0 shadow-inner ${issue.color}`}>
                             <issue.icon className="w-6 h-6" />
                          </div>
                          <div>
                            {/* ── Watermelon UI: Badge for issue severity type label ── */}
                            <Badge tone="secondary" className="mb-2 text-[10px] uppercase tracking-widest border-[#333]">
                              {issue.type}
                            </Badge>
                            <div className="text-[15px] text-neutral-400 leading-relaxed">{issue.desc}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Migration Blueprint CTA */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-r from-indigo-900/40 via-[#0a0a0a] to-blue-900/20 border border-indigo-500/30 p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute -left-32 -top-32 w-64 h-64 bg-indigo-500/20 blur-[100px] pointer-events-none" />
                  <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-3xl font-semibold text-white mb-3 tracking-tight">Execute Migration Blueprint</h3>
                    <p className="text-indigo-200/70 text-lg max-w-2xl leading-relaxed">
                      Instantly architect a project scope transitioning this repository to {results.modernization.framework}.
                    </p>
                  </div>
                  {/* ── Watermelon UI: Button for Generate Blueprint CTA ── */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => router.push(`/workspace?prompt=${encodeURIComponent(`Analyze and scope a highly-detailed modernization architecture for my existing Github codebase: ${repoUrl}. The new baseline framework must be built on ${results.modernization.framework}. Current detected complexity is ${results.modernization.complexity}. Fix all technical debt.`)}`)}
                    className="relative z-10 rounded-xl px-8 py-5 text-lg shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] whitespace-nowrap group"
                  >
                    Generate Blueprint <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
