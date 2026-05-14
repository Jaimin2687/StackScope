"use client";

import { GeneratedScope } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trash2, RefreshCw, XCircle, Download, CreditCard, Copy, ExternalLink, X, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/watermelon";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { downloadScopePDF } from "@/lib/pdf-generator";

interface Props {
  scope: any; // Database row type
  isBin?: boolean;
}

export function ScopeCard({ scope, isBin }: Props) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const content = scope.generated_proposal as GeneratedScope | undefined;
  
  const platformLabel = "StackScope AI";
          
  const [isGeneratingSLA, setIsGeneratingSLA] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [slaUrl, setSlaUrl] = useState<string | null>(null);
  const [localPhases, setLocalPhases] = useState<any[]>(content?.payment_phases || []);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(content?.payment_status || null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const checkPaymentStatus = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const hasLegacyLink = !!content?.payment_link_id;
    const hasPhases = Array.isArray(content?.payment_phases) && content.payment_phases.length > 0;
    
    if (!hasLegacyLink && !hasPhases) return;

    try {
      setIsCheckingStatus(true);
      const res = await fetch("/api/check-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeId: scope.id,
          currentScopeObj: content
        })
      });
      const data = await res.json();
      if (data.phases) {
        setLocalPhases(data.phases);
      }
      if (data.payment_status === 'paid' || data.phases?.some((p: any) => p.status === 'paid')) {
        setPaymentStatus(data.payment_status);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!content) return;
    setIsExporting(true);
    try {
      // Trigger branded PDF generation natively
      await downloadScopePDF(content);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSoftDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!content) return;
    try {
      setIsProcessing(true);
      const supabase = createClient();
      await supabase.from('client_scopes').update({
        is_deleted: true, deleted_at: new Date().toISOString()
      }).eq('id', scope.id);
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!content) return;
    try {
      setIsProcessing(true);
      const supabase = createClient();
      await supabase.from('client_scopes').update({
        is_deleted: false, deleted_at: null
      }).eq('id', scope.id);
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleHardDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsProcessing(true);
      const supabase = createClient();
      await supabase.from('client_scopes').delete().eq('id', scope.id);
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const phases = content?.payment_phases || [];
  
  const generateSLA = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      setIsGeneratingSLA(true);
      const res = await fetch("/api/generate-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: content?.proposal?.title,
          summary: content?.proposal?.summary,
          price: content?.estimates?.base_cost_inr,
          scopeId: scope.id,
          currentScopeObj: content
        })
      });
      const data = await res.json();
      if (data.url) {
        setSlaUrl(data.url);
        // By default show the latest active phase
        const currentPhases = data.phases || [];
        setLocalPhases(currentPhases);
        if (currentPhases.length > 0) {
          setActivePhaseIndex(currentPhases.length - 1);
          setPaymentStatus(currentPhases[currentPhases.length - 1].status);
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSLA(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, urlToCopy: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const CardContent = () => (
    <motion.div 
      whileHover={{ scale: 1.005, y: -2 }}
      className={`group p-5 rounded-lg border border-[#222] ${isBin ? 'bg-[#050505]' : 'bg-[#0a0a0a]'} hover:bg-[#111] hover:border-[#333] transition-all relative ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="pr-12">
          <h3 className="text-base font-medium text-white mb-1.5 group-hover:text-white transition-colors">
            {content?.proposal?.title || "Untitled Architecture"}
          </h3>
          {platformLabel && (
            <div className="mb-2">
              <Badge
                tone="secondary"
                className="text-[11px] px-2 py-0.5 border-[#333] text-neutral-500 bg-[#0f0f0f]"
              >
                {platformLabel}
              </Badge>
            </div>
          )}
          <p className="text-[13px] text-neutral-500 line-clamp-1">
            {content?.proposal?.summary}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {!isBin ? (
            <>
              <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center group-hover:bg-[#222] transition-colors flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex gap-1 mt-1 z-10 flex-col sm:flex-row flex-wrap justify-end">
                <button 
                  disabled={isGeneratingSLA}
                  onClick={generateSLA}
                  className={`p-1.5 hover:bg-[#222] rounded-md transition-colors ${isGeneratingSLA ? 'text-emerald-400/50 cursor-not-allowed' : 'text-neutral-500 hover:text-emerald-400'} flex-shrink-0`}
                  title="Generate SLA & Razorpay Payment Links"
                >
                  {isGeneratingSLA ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <CreditCard className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className={`p-1.5 hover:bg-[#222] rounded-md transition-colors ${isExporting ? 'text-emerald-400/50 cursor-not-allowed' : 'text-neutral-500 hover:text-white'} flex-shrink-0`}
                  title="Download PDF"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Download className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleSoftDelete}
                  className="p-1.5 hover:bg-red-900/30 rounded-md transition-colors text-neutral-500 hover:text-red-400 flex-shrink-0"
                  title="Move to Bin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 items-end justify-end z-10 mt-1">
               <button 
                 onClick={handleRestore}
                 className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#111] hover:bg-[#222] border border-[#333] rounded-md text-[11px] font-medium text-neutral-300 transition-colors whitespace-nowrap" 
                 title="Restore"
               >
                 <RefreshCw className="w-3.5 h-3.5" /> Restore
               </button>
               <button 
                 onClick={handleHardDelete}
                 className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a0a0a] hover:bg-red-900/40 border border-red-900/30 rounded-md text-[11px] font-medium text-red-500 transition-colors whitespace-nowrap" 
                 title="Delete Forever"
               >
                 <XCircle className="w-3.5 h-3.5" /> Delete
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1a1a1a]">
        <div className="flex gap-2">
          {content?.tech_stack?.frontend && content.tech_stack.frontend[0] && (
            <Badge tone="secondary" className="text-[11px] px-2 py-0.5 border-[#333] text-neutral-400">
              {content.tech_stack.frontend[0]}
            </Badge>
          )}
          {content?.tech_stack?.backend && content.tech_stack.backend[0] && (
             <Badge tone="secondary" className="text-[11px] px-2 py-0.5 border-[#333] text-neutral-400">
               {content.tech_stack.backend[0]}
             </Badge>
          )}
        </div>
        <time className="text-[11px] text-neutral-600 font-mono">
          {formatDistanceToNow(new Date(scope.created_at), { addSuffix: true })}
        </time>
      </div>
    </motion.div>
  );

  return (
    <>
      {isBin ? (
        <div className="cursor-default">
          <CardContent />
        </div>
      ) : (
        <Link href={`/workspace?id=${scope.id}`}>
          <CardContent />
        </Link>
      )}

      {/* SLA Popup Modal */}
      <AnimatePresence>
        {slaUrl && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlaUrl(null); }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#111]">
                <div className="flex items-center gap-2 text-white font-medium">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  SLA Checkout Generated
                </div>
                <button 
                  onClick={() => setSlaUrl(null)}
                  title="Close Modal"
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 text-sm text-neutral-400">
                <p>
                  Your legally binding Razorpay payment links for this scope are ready. Share them securely with your client. They will remain active until the invoice is paid.
                </p>

                {localPhases.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {localPhases.map((phase, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActivePhaseIndex(i); }}
                          className={`px-3 py-1.5 rounded-md whitespace-nowrap text-xs font-medium transition-colors ${
                            activePhaseIndex === i 
                              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                              : 'bg-[#111] text-neutral-500 border border-[#333] hover:text-white'
                          }`}
                        >
                          Phase {i + 1} {phase.status === 'paid' ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                    
                    {localPhases[activePhaseIndex] && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium text-base">Phase {activePhaseIndex + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${
                            localPhases[activePhaseIndex].status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {localPhases[activePhaseIndex].status === 'paid' ? 'PAID' : 'PENDING'}
                          </span>
                        </div>
                        
                        <div className="relative group">
                          <input 
                            type="text" 
                            readOnly 
                            title="Razorpay SLA URL"
                            value={localPhases[activePhaseIndex].url || ''} 
                            className="w-full bg-[#050505] border border-[#333] rounded-lg py-3 px-4 text-white pr-10 outline-none select-all focus:border-indigo-500/50 transition-colors"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => handleCopyLink(e, localPhases[activePhaseIndex].url)}
                            disabled={!localPhases[activePhaseIndex].url}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white font-medium transition-colors disabled:opacity-50"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {isCopied ? "Copied" : "Copy Link"}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              if (localPhases[activePhaseIndex].url) window.open(localPhases[activePhaseIndex].url, "_blank");
                            }}
                            disabled={!localPhases[activePhaseIndex].url}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:shadow-none"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative group">
                      <input 
                        type="text" 
                        readOnly 
                        title="Razorpay SLA URL"
                        value={slaUrl!} 
                        className="w-full bg-[#050505] border border-[#333] rounded-lg py-3 px-4 text-white pr-10 outline-none select-all focus:border-indigo-500/50 transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        onClick={(e) => handleCopyLink(e, slaUrl!)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white font-medium transition-colors"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? "Copied" : "Copy Link"}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(slaUrl!, "_blank");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-lg shadow-indigo-900/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Link
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-[#222]">
                  {localPhases.some(p => p.status !== 'paid') || (localPhases.length === 0 && paymentStatus !== 'paid') ? (
                    <button 
                      onClick={checkPaymentStatus}
                      disabled={isCheckingStatus}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-white transition-colors disabled:opacity-50"
                    >
                      {isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <RefreshCw className="w-4 h-4 text-indigo-400" />}
                      Sync Payment Status
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
