"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SideNav } from "@/components/side-nav";
import { AudioDropzone } from "@/components/dropzone";
import { ResultsView } from "@/components/results-view";
import { ProcessingLoader } from "@/components/processing-loader";
import { Globe, FileText, LayoutTemplate, Send, Zap } from "lucide-react";
import { SUPPORTED_LANGUAGES, type GeneratedScope } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const urlPrompt = searchParams.get("prompt");

  const [brief, setBrief] = useState(urlPrompt || "");
  const [language, setLanguage] = useState("en");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopeResult, setScopeResult] = useState<GeneratedScope | null>(null);
  const [activeTab, setActiveTab] = useState<"proposal" | "tech_stack" | "sql_schema">("proposal");
  const [hasAutoRun, setHasAutoRun] = useState(false);

  const briefWordCount = (brief.trim().match(/\S+/g) || []).length;
  const briefIsTooShort = !!brief.trim() && briefWordCount < 5;
  const briefIsTooLong = brief.length > 8000;
  const canGenerate = !!audioFile || (!!brief.trim() && !briefIsTooShort && !briefIsTooLong);

  const handleGenerate = async (overrideBrief?: string) => {
    const textTarget = typeof overrideBrief === "string" ? overrideBrief : brief;

    if (!textTarget && !audioFile) {
      setError("Provide context via text or audio");
      return;
    }

    if (!audioFile) {
      const targetWordCount = (textTarget.trim().match(/\S+/g) || []).length;
      if (textTarget.trim() && targetWordCount < 5) {
        setError("Add a bit more detail (at least ~5 words) or upload audio.");
        return;
      }
      if (textTarget.length > 8000) {
        setError("Brief is too long. Please keep it under 8,000 characters.");
        return;
      }
    }
    setIsLoading(true);
    setError(null);
    setScopeResult(null);

    try {
      const formData = new FormData();
      formData.append("target_language", language);
      if (audioFile) formData.append("audio", audioFile);
      else formData.append("brief", textTarget);

      const response = await fetch("/api/generate-scope", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate scope");
      }
      const data = await response.json();
      setScopeResult(data.scope);
      setActiveTab("proposal");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchScope = async () => {
        setIsLoading(true);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("client_scopes")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (data && data.generated_proposal) {
            setScopeResult(data.generated_proposal);
            setBrief(data.raw_brief || "");
            setLanguage(data.target_language || "en");
            setActiveTab("proposal");
          }
        } catch (err: any) {
          console.error("Error fetching scope:", err);
          setError("Failed to load saved scope.");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchScope();
    } else if (urlPrompt && !hasAutoRun) {
      setHasAutoRun(true);
      handleGenerate(urlPrompt);
    }
  }, [id, urlPrompt, hasAutoRun]);

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <SideNav />

      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
        <header className="px-10 py-6 border-b border-[#222] flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-white mb-1">New Architecture</h1>
            <p className="text-neutral-500 text-sm">Define requirements to generate specifications.</p>
          </div>
          {scopeResult && (
            <div className="flex bg-[#111] p-1 rounded-md">
              {["proposal", "tech_stack", "sql_schema"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={clsx(
                    "px-3 py-1.5 text-[13px] font-medium rounded-sm transition-colors",
                    activeTab === t ? "bg-[#333] text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  {t === "proposal" ? "ARCHITECTURE" : t === "sql_schema" ? "SCHEMA" : t === "sql_schema" ? "SCHEMA" : t.replace("_", " ").toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Input Sidebar */}
          <div className="w-[420px] flex-shrink-0 border-r border-[#222] bg-[#050505] flex flex-col p-6 overflow-y-auto">
            <div className="mb-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#222] flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <span className="text-sm font-medium">Input Context</span>
            </div>

            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the platform you want to build..."
              disabled={!!audioFile || isLoading}
              className="w-full h-40 bg-[#111] border border-[#333] rounded-md p-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#555] resize-none mb-6 transition-colors disabled:opacity-50"
            />

            <div className="-mt-4 mb-6 flex items-center justify-between text-[11px] text-neutral-600">
              <span>
                Tip: include users, core workflow, and 2–3 key features.
              </span>
              <span className={clsx(briefIsTooLong && "text-red-500")}>
                {brief.length.toLocaleString()}/8,000
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-[#222]" />
                <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider">or upload audio</span>
                <div className="h-px flex-1 bg-[#222]" />
              </div>
              <AudioDropzone 
                selectedFile={audioFile}
                onFileSelect={(file) => { setAudioFile(file); setBrief(""); }}
                onClear={() => setAudioFile(null)}
              />
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-[#222]">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-neutral-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Output Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isLoading}
                  aria-label="Output language"
                  className="w-full h-9 bg-[#111] border border-[#333] rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#555]"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                     <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-[13px] text-red-500 py-1">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGenerate()}
                disabled={isLoading || !canGenerate}
                className="w-full h-10 bg-white text-black font-medium text-sm rounded-md flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-neutral-200 transition-colors"
              >
                {isLoading ? "Analyzing..." : (
                  <>
                    Generate
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Right Results Pane */}
          <div className="flex-1 bg-[#0a0a0a] relative overflow-hidden flex flex-col">
            {isLoading ? (
              <ProcessingLoader />
            ) : scopeResult ? (
              <div className="flex-1 overflow-y-auto p-10">
                <div className="max-w-4xl mx-auto">
                    <ResultsView 
                      scope={scopeResult} 
                      activeTab={activeTab} 
                      onTabChange={setActiveTab} 
                      scopeId={id}
                      onScopeUpdate={(newScope) => setScopeResult(newScope)}
                    />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-neutral-500">
                <Zap className="w-8 h-8 mb-4 opacity-50" />
                <h3 className="text-white font-medium text-lg mb-2">Ready to generate</h3>
                <p className="text-sm max-w-[300px]">
                  Provide context on the left to structure your database schema and architecture.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
