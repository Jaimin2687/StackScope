"use client";

import Link from "next/link";
import { Button } from "./ui/watermelon";
import { CopySlash } from "lucide-react";

export function TopNav() {
  return (
    <nav className="fixed top-0 inset-x-0 h-16 border-b border-[#222] bg-black/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
            <CopySlash className="w-4 h-4 text-black" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white group-hover:text-neutral-300 transition-colors">
            StackScope
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/pricing" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors mr-2">
          Pricing
        </Link>
        <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
          Sign in
        </Link>
        <Link href="/login">
          <Button variant="primary" size="sm">Get Started</Button>
        </Link>
      </div>
    </nav>
  );
}
