/**
 * RadialProgress — SVG-based animated radial progress ring.
 * Uses Framer Motion to animate the ring draw on mount.
 */
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadialProgressProps {
  value: number; // 0–100
  label: string;
  color?: "green" | "purple" | "blue" | "amber";
  size?: number;
  strokeWidth?: number;
  className?: string;
  delay?: number;
}

const COLOR_MAP = {
  green: {
    stroke: "#00FF88",
    glow: "drop-shadow(0 0 8px rgba(0,255,136,0.6))",
    text: "text-accent-green",
    bg: "rgba(0,255,136,0.08)",
  },
  purple: {
    stroke: "#9B59FF",
    glow: "drop-shadow(0 0 8px rgba(155,89,255,0.6))",
    text: "text-accent-purple",
    bg: "rgba(155,89,255,0.08)",
  },
  blue: {
    stroke: "#38BDF8",
    glow: "drop-shadow(0 0 8px rgba(56,189,248,0.6))",
    text: "text-sky-400",
    bg: "rgba(56,189,248,0.08)",
  },
  amber: {
    stroke: "#FBBF24",
    glow: "drop-shadow(0 0 8px rgba(251,191,36,0.6))",
    text: "text-amber-400",
    bg: "rgba(251,191,36,0.08)",
  },
};

export function RadialProgress({
  value,
  label,
  color = "green",
  size = 160,
  strokeWidth = 10,
  className,
  delay = 0,
}: RadialProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;
  const { stroke, glow, text, bg } = COLOR_MAP[color];
  const center = size / 2;

  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="meter"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background glow disc */}
        <div
          className="absolute inset-0 rounded-full opacity-40 blur-2xl"
          style={{ background: bg }}
        />

        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, delay, ease: "easeOut" }}
            style={{ filter: glow }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("text-3xl font-bold tabular-nums", text)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.4 }}
          >
            {clampedValue}
          </motion.span>
          <span className="text-xs text-muted mt-0.5">/ 100</span>
        </div>
      </div>

      <span className="text-sm font-medium text-text-muted text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
