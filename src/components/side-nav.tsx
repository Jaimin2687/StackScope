"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CopyPlus, LayoutDashboard, Settings, LogOut, TerminalSquare, FileCode } from "lucide-react";
import { motion } from "framer-motion";

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
        <Link href="/workspace" className="block relative">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-2 text-sm py-2 px-3 bg-white text-black font-medium rounded-md shadow-sm"
          >
            <CopyPlus className="w-4 h-4" />
            New Scope
          </motion.button>
        </Link>
        
        <div className="h-px w-full bg-[#222]" />
        
        <div className="flex flex-col gap-1">
          <Link href="/settings" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#111] transition-colors w-full ${pathname === '/settings' ? 'text-white bg-[#111] border border-[#222]' : 'text-neutral-500 hover:text-neutral-200'}`}>
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-200 rounded-md hover:bg-[#111] transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
