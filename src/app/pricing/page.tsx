"use client";

import React, { useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Check, Info, ArrowRight, Zap, Target, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PricingCheckoutModal } from "./PricingCheckoutModal";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  const plans = [
    {
      name: "The Lead Magnet",
      badge: "Hobby / Free",
      price: "₹0",
      description: "Perfect for testing the waters and experiencing the speed of the StackScope Gemini pipeline.",
      features: [
        "3 Scoping Generations per month",
        "Basic text-to-scope generation",
        "Standard JSON/Markdown output",
        "Community support"
      ],
      disabledFeatures: [
        "White-labeled PDF exports",
        "Mermaid.js architecture flows",
        "1-Click Supabase deployments"
      ],
      icon: Target,
      color: "text-neutral-400"
    },
    {
      name: "The Solo Architect",
      badge: "Most Popular",
      price: billingCycle === "monthly" ? "₹1,499" : "₹14,990",
      period: billingCycle === "monthly" ? "/ mo" : "/ yr",
      description: "The sweet spot for Indian Freelancers. Buy hours of your life back for less than a weekend Swiggy budget.",
      features: [
        "Unlimited Architecture Scopes",
        "Native audio transcription for client calls",
        "1-Click Supabase Schema & RLS Deployment",
        "Auto-generated Mermaid.js flowcharts",
        "White-labeled, branded PDF exports",
        "Dynamic pricing & timeline slider"
      ],
      disabledFeatures: [],
      icon: Zap,
      color: "text-emerald-400",
      popular: true
    },
    {
      name: "The Agency Blueprint",
      badge: "For Dev Shops",
      price: billingCycle === "monthly" ? "₹6,999" : "₹69,990",
      period: billingCycle === "monthly" ? "/ mo" : "/ yr",
      description: "Targeted at dev shops in tier-1/2 cities mapping out projects for a scalable team of developers.",
      features: [
        "Everything in Solo Architect",
        "Up to 5 Team Seats included",
        "Custom Tech Stack Enforcement (e.g., Lock to MERN)",
        "Shared workspace to track incoming leads",
        "Priority dedicated support channel",
        "API webhook access"
        
      ],
      disabledFeatures: [],
      icon: Briefcase,
      color: "text-indigo-400"
    }
  ];

  const handleSubscribe = async (planName: string, priceStr: string, cycle: "monthly" | "yearly") => {
    if (priceStr === "₹0") {
      window.location.href = "/workspace";
      return;
    }
    
    setSelectedPlanName(planName);
    setSelectedPrice(priceStr);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black pb-20">
      <TopNav />
      
      <main className="pt-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Pricing built for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Builder.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-400"
          >
            Whether you are closing your first client or running an agency, we have a plan to automate your architecture.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mt-10"
          >
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-medium' : 'text-neutral-500'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
              aria-label="Toggle billing cycle"
              className="w-12 h-6 rounded-full bg-[#222] relative flex items-center px-1 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white font-medium' : 'text-neutral-500'}`}>
              Yearly <span className="text-emerald-400 text-xs ml-1 font-medium">(Save 16%)</span>
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className={`relative rounded-2xl p-8 bg-[#0a0a0a] border ${plan.popular ? 'border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]' : 'border-[#222]'} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center ${plan.color}`}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <span className="text-xs text-neutral-500 font-medium">{plan.badge}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-neutral-500 mb-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-neutral-400 mt-4 leading-relaxed h-[80px]">{plan.description}</p>
              </div>

              <button 
                onClick={() => handleSubscribe(plan.name, plan.price, billingCycle)}
                className={`w-full py-3 rounded-lg font-medium transition-all mb-8 flex items-center justify-center gap-2
                  ${plan.popular 
                    ? 'bg-white text-black hover:bg-neutral-200' 
                    : 'bg-[#111] text-white border border-[#333] hover:bg-[#222]'}`}
              >
                {plan.price === "₹0" ? "Start Free" : "Upgrade to Pro"}
                {plan.popular && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="space-y-4 flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Included</p>
                {plan.features.map(feature => (
                  <div key={feature} className="flex gap-3 text-sm text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
                
                {plan.disabledFeatures.length > 0 && (
                  <>
                    <div className="h-px w-full bg-[#222] my-4" />
                    {plan.disabledFeatures.map(feature => (
                      <div key={feature} className="flex gap-3 text-sm text-neutral-600">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-50" />
                        <span className="line-through">{feature}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedPlanName && selectedPrice && billingCycle && (
          <PricingCheckoutModal 
            planName={selectedPlanName} 
            price={selectedPrice}
            cycle={billingCycle}
            onClose={() => {
              setSelectedPlanName(null);
              setSelectedPrice(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
