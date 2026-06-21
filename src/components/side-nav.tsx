"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CopyPlus, LayoutDashboard, Settings, LogOut, TerminalSquare, FileCode, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/watermelon";
import { useState } from "react";

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      // refresh() clears the server-side session cache, then replace() redirects
      router.refresh();
      router.replace("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
      setSigningOut(false);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Workspace", href: "/workspace", icon: TerminalSquare },
    { name: "Repo Analyzer", href: "/analyzer", icon: FileCode },
  ];

  return (
    <motion.nav 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 h-screen border-r border-[#222] bg-[#000] flex flex-col pt-6 pb-6 px-4 sticky top-0"
    >
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-black rounded-sm" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-white">
          StackScope
        </span>
      </div>

      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="block relative">
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute inset-0 bg-[#111] rounded-md border border-[#222]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div 
                whileHover={{ x: 2 }}
                className={`relative z-10 flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-200"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto space-y-4">
        {/* ── Watermelon UI: Button (primary) for New Scope CTA ── */}
        <Link href="/workspace" className="block">
          <Button variant="primary" size="sm" className="w-full rounded-md">
            <CopyPlus className="w-4 h-4" />
            New Scope
          </Button>
        </Link>
        
        <div className="h-px w-full bg-[#222]" />
        
        <div className="flex flex-col gap-1">
          {/* ── Watermelon UI: Button (ghost) for Settings ── */}
          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start gap-3 rounded-md ${pathname === '/settings' ? 'text-white bg-[#111] border border-[#222]' : ''}`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Link href="/settings/team">
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start gap-3 rounded-md ${pathname.startsWith('/settings/team') ? 'text-white bg-[#111] border border-[#222]' : ''}`}
            >
              <Users className="w-4 h-4" />
              Team
            </Button>
          </Link>
          {/* ── Watermelon UI: Button (ghost) for Sign Out ── */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full justify-start gap-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className={`w-4 h-4 ${signingOut ? "animate-spin" : ""}`} />
            {signingOut ? "Signing out…" : "Sign Out"}
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
