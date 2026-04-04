"use client";

import React from "react";
import clsx from "clsx";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:pointer-events-none rounded-md";
    const variants = {
      primary: "bg-white text-black hover:bg-neutral-200",
      secondary: "bg-[#111] text-white border border-[#333] hover:bg-[#222]",
      ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5",
      destructive: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={clsx("rounded-xl border border-[#333] bg-[#0a0a0a] shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "flex h-10 w-full rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        "flex min-h-[80px] w-full rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          "flex h-10 w-full appearance-none rounded-md border border-[#333] bg-[#000] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">
        ▼
      </span>
    </div>
  )
);
Select.displayName = "Select";

export const Badge: React.FC<{ tone?: "primary" | "secondary" | "neutral"; children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>> = ({ tone = "neutral", className, children, ...props }) => {
  const styles = {
    primary: "bg-white/10 text-white border border-white/20",
    secondary: "bg-[#111] text-neutral-300 border border-[#333]",
    neutral: "bg-transparent text-neutral-500 border border-transparent",
  };
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", styles[tone], className)} {...props}>
      {children}
    </span>
  );
};
