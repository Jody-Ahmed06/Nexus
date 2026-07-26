/**
 * GlassCard — glassmorphic card surface primitive.
 */
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  /** Adds a subtle neon border glow */
  glow?: "green" | "purple" | "none";
}

export function GlassCard({
  children,
  className,
  glow = "none",
  ...props
}: GlassCardProps) {
  const glowClass =
    glow === "green"
      ? "border-accent-green/30 shadow-[0_0_30px_rgba(0,255,136,0.08)]"
      : glow === "purple"
      ? "border-accent-purple/30 shadow-[0_0_30px_rgba(155,89,255,0.08)]"
      : "border-white/[0.06]";

  return (
    <motion.div
      className={cn(
        "rounded-2xl border bg-white/[0.04] backdrop-blur-xl",
        glowClass,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
