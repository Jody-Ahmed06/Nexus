/**
 * VideoFeed — Picture-in-picture webcam component with eye-contact badge overlay.
 */
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  eyeContactPercent: number;
  isTracking: boolean;
  isModelLoading: boolean;
  className?: string;
}

export function VideoFeed({
  videoRef,
  eyeContactPercent,
  isTracking,
  isModelLoading,
  className,
}: VideoFeedProps) {
  const quality =
    eyeContactPercent >= 75
      ? { label: "Great", color: "#00FF88" }
      : eyeContactPercent >= 50
      ? { label: "OK", color: "#FBBF24" }
      : { label: "Low", color: "#EF4444" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl",
        className
      )}
      style={{ width: 200, height: 150 }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover scale-x-[-1]" // Mirror for natural feel
      />

      {/* Loading overlay */}
      {isModelLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
          <span className="text-xs text-text-muted">Loading AI vision…</span>
        </div>
      )}

      {/* Eye contact badge */}
      {isTracking && !isModelLoading && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold backdrop-blur-md"
            style={{
              background: `rgba(${quality.color === "#00FF88" ? "0,255,136" : quality.color === "#FBBF24" ? "251,191,36" : "239,68,68"},0.15)`,
              border: `1px solid ${quality.color}40`,
              color: quality.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: quality.color }}
            />
            👁 {eyeContactPercent}%
          </div>
          <div
            className="rounded-full px-2 py-1 text-xs backdrop-blur-md"
            style={{
              background: `${quality.color}15`,
              border: `1px solid ${quality.color}30`,
              color: quality.color,
            }}
          >
            {quality.label}
          </div>
        </div>
      )}

      {/* Corner label */}
      <div className="absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted bg-black/50 backdrop-blur-sm">
        You
      </div>

      {/* Border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-all duration-500"
        style={{
          boxShadow: isTracking
            ? `inset 0 0 0 1px ${quality.color}30, 0 0 20px ${quality.color}15`
            : "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />
    </motion.div>
  );
}
