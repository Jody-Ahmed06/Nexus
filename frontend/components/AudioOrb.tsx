/**
 * AudioOrb — Animated glowing orb that reacts to Vapi voice activity.
 * Idle: dim slow pulse. Speaking: bright rapid pulse with neon glow bloom.
 */
"use client";

import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AudioOrbProps {
  isSpeaking: boolean;
  volumeLevel: number; // 0.0–1.0
  isMockMode?: boolean;
}

export function AudioOrb({ isSpeaking, volumeLevel, isMockMode }: AudioOrbProps) {
  const controls = useAnimation();
  const vol = Math.max(0, Math.min(1, volumeLevel));

  useEffect(() => {
    if (isSpeaking) {
      controls.start({
        scale: [1, 1.08 + vol * 0.18, 1.04 + vol * 0.08, 1.1 + vol * 0.2, 1],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    } else {
      controls.start({
        scale: [1, 1.04, 1],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    }
  }, [isSpeaking, vol, controls]);

  const innerGlow = isSpeaking
    ? `0 0 ${40 + vol * 80}px rgba(0,255,136,${0.4 + vol * 0.5}), 0 0 ${20 + vol * 40}px rgba(0,255,136,${0.3 + vol * 0.4})`
    : "0 0 40px rgba(0,255,136,0.1), 0 0 20px rgba(155,89,255,0.08)";

  const outerGlow = isSpeaking
    ? `0 0 ${80 + vol * 120}px rgba(0,255,136,${0.15 + vol * 0.2}), 0 0 ${50 + vol * 80}px rgba(155,89,255,${0.1 + vol * 0.15})`
    : "0 0 60px rgba(0,255,136,0.05)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
      {/* Outer bloom */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle, rgba(0,255,136,0.06) 0%, rgba(155,89,255,0.04) 50%, transparent 70%)",
          boxShadow: outerGlow,
        }}
        animate={controls}
      />

      {/* Mid ring */}
      <motion.div
        className="absolute rounded-full border"
        style={{
          width: 180,
          height: 180,
          borderColor: isSpeaking
            ? `rgba(0,255,136,${0.3 + vol * 0.5})`
            : "rgba(0,255,136,0.08)",
          background: "transparent",
        }}
        animate={{
          rotate: 360,
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 0.4, repeat: Infinity },
        }}
      />

      {/* Core orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: 120,
          height: 120,
          background: isSpeaking
            ? `radial-gradient(circle, rgba(0,255,136,${0.7 + vol * 0.3}) 0%, rgba(0,200,100,0.4) 50%, rgba(155,89,255,0.2) 100%)`
            : "radial-gradient(circle, rgba(0,255,136,0.3) 0%, rgba(155,89,255,0.15) 60%, rgba(0,0,0,0.2) 100%)",
          boxShadow: innerGlow,
        }}
        animate={controls}
      >
        {/* Inner noise texture via layered pseudo-radials */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-tl from-accent-green/10 to-transparent" />
      </motion.div>

      {/* Mock mode badge */}
      {isMockMode && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-accent-purple/30 bg-accent-purple/10 px-3 py-1 text-xs text-accent-purple">
          MOCK MODE — Add NEXT_PUBLIC_VAPI_KEY for live calls
        </div>
      )}

      {/* Speaking indicator label */}
      <motion.div
        className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium"
        animate={{ opacity: isSpeaking ? 1 : 0.4 }}
        transition={{ duration: 0.3 }}
        style={{ color: isSpeaking ? "#00FF88" : "#6B7280" }}
      >
        {isSpeaking ? "AI is speaking…" : "Listening…"}
      </motion.div>
    </div>
  );
}
