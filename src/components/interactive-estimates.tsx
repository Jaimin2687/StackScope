"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";
import type { Estimates, OptionalFeature } from "@/lib/types";

interface Props {
  estimates: Estimates;
  isEditing?: boolean;
  onChange?: (updated: Estimates) => void;
}

export function InteractiveEstimates({ estimates, isEditing, onChange }: Props) {
  const baseCost = estimates.base_cost_inr || 150000; // Fallback defaults
  const baseWeeks = estimates.base_weeks || 4;
  const features = estimates.optional_features || [];

  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(features.filter(f => f.selected_by_default).map(f => f.id || f.name))
  );

  const toggleFeature = (id: string) => {
    const next = new Set(selectedFeatures);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFeatures(next);
  };

  const currentCost = baseCost + features.reduce((acc, f) => {
    if (selectedFeatures.has(f.id || f.name)) return acc + Number(f.cost_add_inr);
    return acc;
  }, 0);

  const currentWeeks = baseWeeks + features.reduce((acc, f) => {
    if (selectedFeatures.has(f.id || f.name)) return acc + Number(f.weeks_add);
    return acc;
  }, 0);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
      {/* Header totals */}
      <div className="p-6 border-b border-[#222] flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#050505]">
        <div>
          <h3 className="text-neutral-500 text-sm font-medium uppercase tracking-wider mb-2">Estimated Investment</h3>
          <div className="flex items-baseline gap-4">
            <motion.div 
              key={currentCost}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-semibold text-white tracking-tight"
            >
              {formatINR(currentCost)}
            </motion.div>
            <motion.div 
              key={currentWeeks}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-neutral-400 text-sm"
            >
              / {currentWeeks} weeks
            </motion.div>
          </div>
        </div>
      </div>

      {/* Feature Slider List */}
      <div className="p-6">
        <h4 className="text-sm font-medium text-white mb-4">Scope Configuration</h4>
        <div className="space-y-3">
          {/* Base Scope */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-[#333] bg-[#111]">
            <div className="flex gap-4">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Base Platform MVP</div>
                <div className="text-xs text-neutral-500 mt-1">Core architecture, database schema, and mandatory APIs.</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {isEditing ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                     <span className="text-xs text-neutral-500">₹</span>
                     <input 
                       type="number" 
                       title="Edit Base Cost"
                       aria-label="Base Cost Indian Rupees"
                       placeholder="150000"
                       value={baseCost} 
                       onChange={(e) => onChange?.({...estimates, base_cost_inr: Number(e.target.value)})}
                       className="w-24 bg-black/50 border border-[#333] rounded px-2 py-1 outline-none text-right text-sm font-medium text-white appearance-none" 
                     />
                  </div>
                  <div className="flex items-center gap-1">
                     <input 
                       type="number" 
                       title="Edit Base Weeks"
                       aria-label="Base Cost Weeks"
                       placeholder="4"
                       value={baseWeeks} 
                       onChange={(e) => onChange?.({...estimates, base_weeks: Number(e.target.value)})}
                       className="w-12 bg-black/50 border border-[#333] rounded px-1 py-0.5 outline-none text-right text-xs text-neutral-400 appearance-none" 
                     />
                     <span className="text-xs text-neutral-500">wks</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-neutral-300">Included</div>
                  <div className="text-xs text-neutral-600 mt-1">{baseWeeks} wks</div>
                </>
              )}
            </div>
          </div>

          {/* Optional Toggles */}
          <AnimatePresence>
            {features.map((feat, i) => {
              const fId = feat.id || feat.name;
              const isSelected = selectedFeatures.has(fId);

              return (
                <div
                  key={fId}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left ${
                    isSelected 
                      ? 'border-blue-500/50 bg-blue-500/10' 
                      : 'border-[#222] bg-[#0a0a0a]'
                  }`}
                >
                  <button
                    onClick={() => toggleFeature(fId)}
                    className="flex-1 flex gap-4 text-left"
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-500 text-white' : 'border border-[#444] text-transparent'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <div className={`text-sm font-medium transition-colors ${isSelected ? 'text-blue-100' : 'text-neutral-300'}`}>
                        {feat.name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">{feat.description}</div>
                    </div>
                  </button>
                  <div className="text-right flex-shrink-0 pl-4 border-l border-[#333]">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                           <span className="text-xs text-neutral-500">+ ₹</span>
                           <input 
                             type="number" 
                             title="Edit Feature Cost"
                             aria-label="Feature Additional Cost INR"
                             placeholder="50000"
                             value={feat.cost_add_inr} 
                             onChange={(e) => {
                               const newFeats = [...features];
                               newFeats[i] = { ...feat, cost_add_inr: Number(e.target.value) };
                               onChange?.({...estimates, optional_features: newFeats});
                             }}
                             className="w-20 bg-black/50 border border-[#333] rounded px-2 py-1 outline-none text-right text-sm font-medium text-blue-200 appearance-none" 
                           />
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-xs text-neutral-500">+</span>
                           <input 
                             type="number" 
                             title="Edit Feature Weeks"
                             aria-label="Feature Additional Weeks"
                             placeholder="2"
                             value={feat.weeks_add} 
                             onChange={(e) => {
                               const newFeats = [...features];
                               newFeats[i] = { ...feat, weeks_add: Number(e.target.value) };
                               onChange?.({...estimates, optional_features: newFeats});
                             }}
                             className="w-12 bg-black/50 border border-[#333] rounded px-1 py-0.5 outline-none text-right text-xs text-neutral-400 appearance-none" 
                           />
                           <span className="text-xs text-neutral-500">wks</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`text-sm font-medium ${isSelected ? 'text-blue-200' : 'text-neutral-400'}`}>
                          + {formatINR(feat.cost_add_inr)}
                        </div>
                        <div className="text-xs text-neutral-600 mt-1">+ {feat.weeks_add} wks</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}