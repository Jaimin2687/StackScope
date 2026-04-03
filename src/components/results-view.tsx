"use client";

import { GeneratedScope } from "@/lib/types";
import { downloadScopePDF } from "@/lib/pdf-generator";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2, Download, Rocket, Settings2, X, Edit3, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { InteractiveEstimates } from "./interactive-estimates";
import Link from "next/link";
import { checkConfigurationStatus } from "@/app/settings/actions";

// Heavy component - Code-split aggressively so initial renders aren't blocked by 1.5MB payload
const MermaidDiagram = dynamic(() => import("./mermaid-diagram").then(mod => mod.MermaidDiagram), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-emerald-400/50 italic animate-pulse">Initializing Diagram Engine...</div>
});

interface Props {
  scope: GeneratedScope;
  activeTab: "proposal" | "tech_stack" | "sql_schema";
  onTabChange: (tab: "proposal" | "tech_stack" | "sql_schema") => void;
}

export function ResultsView({ scope, activeTab }: Props) {
  const [copied, setCopied] = useState(false);
  const [deployStatus, setDeployStatus] = useState<"idle" | "deploying" | "success">("idle");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedScope, setEditedScope] = useState<GeneratedScope>(scope);
  
  useEffect(() => {
    setEditedScope(scope);
  }, [scope]);

  useEffect(() => {
    // Check server configuration
    checkConfigurationStatus().then(status => {
      setHasConfig(status);
    });
  }, []);

  function renderValue(v: any) {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join("; ");
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = async () => {
    if (!hasConfig) {
      setShowConfigModal(true);
      return;
    }

      try {
        setDeployStatus("deploying");
        
        const res = await fetch("/api/deploy-schema", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            schema: editedScope.sql_schema
          }),
        });      const data = await res.json();
      
      if (!res.ok) {
        alert(`Supabase Error: ${data.error || "Deployment failed"}\n\nThe AI may have generated conflicting foreign keys (e.g., missing a users table). Try generating a new scope!`);
        setDeployStatus("idle");
        return;
      }
      
      setDeployStatus("success");
      setTimeout(() => setDeployStatus("idle"), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to deploy SQL Schema. Please check configuration.");
      setDeployStatus("idle");
    }
  };
  
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/generate-sla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedScope.proposal.title,
          summary: editedScope.proposal.summary,
          estimates: editedScope.estimates
        })
      });
      const data = await res.json();
      downloadScopePDF(editedScope, data.url);
    } catch (err) {
      console.error(err);
      downloadScopePDF(editedScope); // fallback
    } finally {
      setIsExporting(false);
    }
  };

  const renderActionBar = () => (
    <div className="flex justify-end relative z-10 gap-2 mb-6">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className={`flex flex-shrink-0 items-center gap-2 px-3 py-1.5 ${isEditing ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-[#111] hover:bg-[#222] text-neutral-300 border border-[#333]'} rounded-md text-[12px] font-medium transition-colors`}
      >
        {isEditing ? <><Save className="w-3.5 h-3.5" /> Save Edits</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
      </button>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`flex flex-shrink-0 items-center gap-2 px-3 py-1.5 ${isExporting ? 'bg-[#222] text-emerald-400/50 cursor-not-allowed' : 'bg-[#111] hover:bg-[#222] text-neutral-300'} border border-[#333] rounded-md text-[12px] font-medium transition-colors`}
      >
        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
        {isExporting ? 'Preparing Artifact...' : 'Export PDF'}
      </button>
    </div>
  );

  const containerState = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } }
  };

  const itemState = {
    hidden: { opacity: 0, y: 5 },
    show: { opacity: 1, y: 0 }
  };

  if (activeTab === "proposal") {
    const s = editedScope as any;
    
    return (
      <motion.div variants={containerState} initial="hidden" animate="show" className="space-y-12 pb-20">
        {renderActionBar()}

        {/* Header */}
        <motion.div variants={itemState} className="space-y-3 pb-6 border-b border-[#222] pt-4">
          <h2 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => setEditedScope({...editedScope, proposal: {...editedScope.proposal, title: e.target.innerText}})}
            className={`text-3xl font-semibold tracking-tight text-white mb-2 ${isEditing ? 'border-b border-dashed border-[#555] outline-none pb-1 hover:bg-white/5 cursor-text' : ''}`}
          >
            {renderValue(editedScope.proposal.title)}
          </h2>
          <p 
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => setEditedScope({...editedScope, proposal: {...editedScope.proposal, summary: e.target.innerText}})}
            className={`text-neutral-400 text-base leading-relaxed max-w-3xl ${isEditing ? 'border-b border-dashed border-[#555] outline-none pb-1 hover:bg-white/5 cursor-text' : ''}`}
          >
            {renderValue(editedScope.proposal.summary)}
          </p>
        </motion.div>

        {/* Dynamic Estimates Slider */}
        {s.estimates && s.estimates.optional_features && (
          <motion.div variants={itemState}>
            <InteractiveEstimates 
              estimates={s.estimates} 
              isEditing={isEditing} 
              onChange={(newEst) => setEditedScope({ ...editedScope, estimates: newEst })} 
            />
          </motion.div>
        )}

        {/* Architecture Diagram */}
        {s.mermaid_diagram && (
          <motion.div variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Architecture Overview
            </h3>
            <MermaidDiagram chart={s.mermaid_diagram} />
          </motion.div>
        )}

        {/* Objectives */}
        {editedScope.proposal.objectives && editedScope.proposal.objectives.length > 0 && (
          <motion.div variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Business Objectives
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editedScope.proposal.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-3 p-4 rounded-md border border-[#222] bg-[#0c0c0c]">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span 
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const newObj = [...editedScope.proposal.objectives];
                      newObj[i] = e.target.innerText;
                      setEditedScope({...editedScope, proposal: {...editedScope.proposal, objectives: newObj}});
                    }}
                    className={`text-sm text-neutral-300 leading-relaxed ${isEditing ? 'border-b border-dashed border-[#555] outline-none pb-1 hover:bg-white/5 cursor-text w-full block' : ''}`}
                  >
                    {renderValue(obj)}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Assumptions */}
        {s.assumptions && s.assumptions.length > 0 && (
          <motion.div variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" /> Key Assumptions
            </h3>
            <div className="p-5 rounded-md border border-[#222] bg-[#0a0a0a]">
              <ul className="space-y-3">
                {s.assumptions.map((ass: any, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                    <span className="text-neutral-600 font-mono text-xs mt-0.5">{i + 1}.</span> {renderValue(ass)}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Sprint Timeline */}
        {scope.sprint_timeline && scope.sprint_timeline.length > 0 && (
          <motion.div variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Execution Timeline
            </h3>
            <div className="space-y-4">
              {scope.sprint_timeline.map((sprint, i) => (
                <div key={i} className="p-5 rounded-md border border-[#222] bg-[#0a0a0a] flex flex-col md:flex-row gap-6">
                  <div className="md:w-48 flex-shrink-0">
                    <div className="text-white font-medium mb-1">Sprint {sprint.sprint}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wide">{sprint.duration || "2 weeks"}</div>
                  </div>
                  <ul className="flex-1 space-y-2">
                    {sprint.tasks?.map((task, j) => (
                      <li key={j} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#444] mt-2 flex-shrink-0" />
                        {renderValue(task)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* API Endpoints */}
        {s.api_endpoints && s.api_endpoints.length > 0 && (
          <motion.div variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> API Endpoints (Core)
            </h3>
            <div className="rounded-md border border-[#222] bg-[#0a0a0a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#111] border-b border-[#222] text-neutral-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">Endpoint</th>
                      <th className="px-4 py-3 font-medium">Auth</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {s.api_endpoints.map((ep: any, i: number) => (
                      <tr key={i} className="hover:bg-[#111] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">
                          <span className={
                            ep.method?.includes('GET') ? 'text-blue-400' :
                            ep.method?.includes('POST') ? 'text-emerald-400' :
                            ep.method?.includes('DELETE') ? 'text-red-400' : 'text-amber-400'
                          }>{ep.method}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-300">{ep.path}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          {ep.auth_required ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#222] text-neutral-300">Required</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border border-[#222] text-neutral-500">Public</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 max-w-[200px] truncate" title={renderValue(ep.request_schema_summary || ep.response_schema_summary)}>
                          {renderValue(ep.request_schema_summary || ep.response_schema_summary) || "..."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security & Data Model */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {s.data_model_summary && s.data_model_summary.entities && (
            <motion.div variants={itemState} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Core Entities
              </h3>
              <div className="p-5 rounded-md border border-[#222] bg-[#0a0a0a] space-y-4">
                {s.data_model_summary.entities.map((ent: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-cyan-400">{ent.name}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-2">{ent.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ent.key_fields?.map((kf: string, j: number) => (
                        <span key={j} className="px-2 py-0.5 rounded-sm bg-[#1a1a1a] border border-[#333] text-[10px] text-neutral-400 font-mono">
                          {kf}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {s.security && (
            <motion.div variants={itemState} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Security & Access
              </h3>
              <dl className="p-5 rounded-md border border-[#222] bg-[#0a0a0a] space-y-4 text-sm">
                {Object.entries(s.security).map(([k, v]) => (
                   <div key={k}>
                     <dt className="text-neutral-500 capitalize text-xs tracking-wider mb-1">{k.replace(/_/g, " ")}</dt>
                     <dd className="text-neutral-300">{String(v)}</dd>
                   </div>
                ))}
              </dl>
            </motion.div>
          )}
        </div>

        {/* Estimates Fallback (if no optional features provided) */}
        {s.estimates && !s.estimates.optional_features && (
          <motion.div variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Project Estimates
            </h3>
            <div className="p-5 rounded-md border border-[#222] bg-[#0a0a0a] flex flex-wrap gap-8 text-sm">
              {Object.entries(s.estimates).map(([k, v]) => {
                 if (typeof v === 'object' || k === 'optional_features') return null;
                 return (
                   <div key={k} className="flex flex-col">
                     <span className="text-neutral-500 capitalize text-xs tracking-wider mb-1">{k.replace(/_/g, " ")}</span>
                     <span className="text-neutral-200 text-lg font-medium">{String(v)}</span>
                   </div>
                 );
              })}
            </div>
          </motion.div>
        )}

      </motion.div>
    );
  }

  if (activeTab === "tech_stack") {
    return (
      <motion.div variants={containerState} initial="hidden" animate="show" className="space-y-8 pb-20">
        {renderActionBar()}

        {Object.entries(editedScope.tech_stack).map(([category, items]) => (
          <motion.div key={category} variants={itemState} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {category.replace("_", " ")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <input 
                  type="text"
                  value={(Array.isArray(items) ? items : [items]).join(", ")}
                  onChange={(e) => {
                    const newTech = { ...editedScope.tech_stack };
                    (newTech as any)[category] = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                    setEditedScope({...editedScope, tech_stack: newTech});
                  }}
                  className="w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-[13px] font-medium text-neutral-300 focus:outline-none focus:border-indigo-500/50"
                  placeholder="e.g. Next.js, React, Tailwind CSS"
                />
              ) : (
                (Array.isArray(items) ? items : [items]).map((tech: any, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-full border border-[#333] bg-[#111] text-[13px] font-medium text-neutral-300">
                    {tech}
                  </span>
                ))
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (activeTab === "sql_schema") {
    return (
      <motion.div variants={containerState} initial="hidden" animate="show" className="relative group pb-20 space-y-4">
        {renderActionBar()}
        
        {/* 1-Click Provisioning Mock */}
        <motion.div variants={itemState} className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center p-4 border border-[#222] bg-[#0a0a0a] rounded-lg">                                                                                                      
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Database Provisioning</h3>
            <p className="text-xs text-neutral-500">Deploy this schema directly to your connected Supabase project.</p>
          </div>
          <div className="flex items-center gap-2">
            {!hasConfig && (
              <button 
                onClick={() => setShowConfigModal(true)}
                className="p-2 rounded-md hover:bg-[#222] text-neutral-500 hover:text-white transition-colors border border-[#333]"
                title="Configure Database"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleDeploy}
              disabled={deployStatus !== "idle"}
              className={`flex items-center gap-2 px-4 py-2 rounded-md justify-center text-sm font-medium transition-all ${
                deployStatus === "idle" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20" :
                deployStatus === "deploying" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 cursor-wait" :
                "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
              }`}
            >
              {deployStatus === "idle" && <><Rocket className="w-4 h-4" /> 1-Click Deploy</>}
              {deployStatus === "deploying" && (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" /> Executing SQL...</>                                                    
              )}
              {deployStatus === "success" && <><CheckCircle2 className="w-4 h-4" /> Deployed Successfully</>}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemState} className="relative rounded-md border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => copyRef(scope.sql_schema)}
              className="p-2 bg-[#222] border border-[#333] rounded-md text-neutral-400 hover:text-white transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="px-4 py-2 border-b border-[#222] bg-[#111] flex items-center justify-between">
            <span className="text-[12px] font-mono text-neutral-500">schema.sql</span>
          </div>
          {isEditing ? (
            <textarea
              aria-label="SQL Schema Editor"
              placeholder="CREATE TABLE..."
              title="Edit SQL Schema"
              className="w-full min-h-[500px] p-5 bg-[#050505] text-[13px] leading-relaxed font-mono text-neutral-300 resize-y focus:outline-none custom-scrollbar"
              value={editedScope.sql_schema}
              onChange={(e) => setEditedScope({...editedScope, sql_schema: e.target.value})}
              spellCheck="false"
            />
          ) : (
            <pre className="p-5 overflow-x-auto text-[13px] leading-relaxed font-mono text-neutral-300 whitespace-pre-wrap break-words">
              <code>{editedScope.sql_schema}</code>
            </pre>
          )}
        </motion.div>

        {/* Missing Config Modal */}
        <AnimatePresence>
          {showConfigModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl w-full max-w-md p-6 relative"
              >
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-medium text-white mb-2">Configure Target Database</h3>
                <p className="text-sm text-neutral-400 mb-6">
                  To use 1-Click Deployment, you need to link your own Supabase project credentials in your settings.
                </p>
                <div className="flex gap-3 justify-end mt-8">
                  <button 
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <Link href="/settings">
                    <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors">
                      Go to Settings
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}
