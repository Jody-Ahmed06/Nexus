/**
 * GradientButton — premium CTA button with neon gradient and shimmer hover.
 */
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GradientButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className,
  ...props
}: GradientButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variants = {
    primary:
      "bg-gradient-to-r from-accent-green via-emerald-400 to-accent-purple text-bg-base shadow-[0_0_30px_rgba(0,255,136,0.25)]",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.3)]",
    ghost:
      "border border-white/10 bg-white/[0.04] text-text-primary backdrop-blur-sm hover:bg-white/[0.08]",
  };

  return (
    <motion.button
      className={cn(
        base,
        sizes[size],
        variants[variant],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={!disabled && !isLoading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer overlay */}
      {variant === "primary" && !disabled && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 hover:translate-x-full" />
      )}

      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
