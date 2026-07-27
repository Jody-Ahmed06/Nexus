/**
 * Scorecard — Post-interview dashboard with Recharts and Framer Motion.
 */
"use client";

import { motion, type Variants } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { RadialProgress } from "@/components/ui/RadialProgress";
import { useToast } from "@/components/ui/Toast";
import { FeedbackData, useInterviewStore } from "@/store/interviewStore";

interface ScorecardProps {
  feedback: FeedbackData;
  eyeContactPercent: number;
  onRetake: () => void;
}

// ─── Container animation ───────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ─── Custom Recharts Tooltip ───────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-surface/90 backdrop-blur-xl px-3 py-2 text-sm">
        <p className="font-medium text-text-primary">{payload[0]?.payload?.subject}</p>
        <p className="text-accent-green">{payload[0]?.value} / 100</p>
      </div>
    );
  }
  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Scorecard({ feedback, eyeContactPercent, onRetake }: ScorecardProps) {
  const { toast } = useToast();

  const storeEyeContactPercent = useInterviewStore((state) => state.eyeContactPercent);
  const finalEyeContactPercent = storeEyeContactPercent > 0 ? storeEyeContactPercent : eyeContactPercent;

  const radarData = [
    { subject: "Technical", A: feedback.technical },
    { subject: "Communication", A: feedback.communication },
    { subject: "Confidence", A: feedback.confidence },
    { subject: "Eye Contact", A: finalEyeContactPercent },
    { subject: "Overall", A: feedback.overall },
  ];

  const handleDownloadPDF = () => {
    window.print();
  };

  const overallColor =
    feedback.overall >= 80
      ? "text-accent-green"
      : feedback.overall >= 60
        ? "text-amber-400"
        : "text-red-400";

  return (
    <motion.main
      className="min-h-screen bg-bg-base px-4 py-10 overflow-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/5 px-4 py-1.5 text-xs font-medium text-accent-green uppercase tracking-widest">
          Interview Complete
        </div>
        <h1 className="text-4xl font-bold text-text-primary md:text-5xl">
          Your{" "}
          <span className="bg-gradient-to-r from-accent-green to-accent-purple bg-clip-text text-transparent">
            Scorecard
          </span>
        </h1>
        <p className="mt-2 text-text-muted">
          Overall performance:{" "}
          <span className={`font-bold text-xl ${overallColor}`}>
            {feedback.overall}/100
          </span>
        </p>
      </motion.div>

      <div className="mx-auto max-w-5xl space-y-8">
        {/* ── Radial metrics ── */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-8">
            <h2 className="mb-8 text-lg font-semibold text-text-primary">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <RadialProgress
                value={feedback.technical}
                label="Technical Accuracy"
                color="green"
                delay={0.1}
              />
              <RadialProgress
                value={feedback.communication}
                label="Communication"
                color="purple"
                delay={0.25}
              />
              <RadialProgress
                value={feedback.confidence}
                label="Confidence"
                color="blue"
                delay={0.4}
              />
              <RadialProgress
                value={finalEyeContactPercent}
                label="Eye Contact"
                color="amber"
                delay={0.55}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Radar Chart ── */}
        <motion.div variants={itemVariants}>
          <GlassCard glow="purple" className="p-8">
            <h2 className="mb-6 text-lg font-semibold text-text-primary">
              Competency Overview
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#9CA3AF", fontSize: 12, fontFamily: "Inter" }}
                  />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#00FF88"
                    fill="#00FF88"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Feedback text ── */}
        <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
          {/* Detailed AI Feedback */}
          <GlassCard glow="green" className="p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h2 className="font-semibold text-text-primary">Detailed AI Feedback</h2>
            </div>
            <p className="text-sm leading-relaxed text-text-muted">
              {feedback.detailed_feedback}
            </p>
          </GlassCard>

          {/* Areas for Improvement */}
          <GlassCard className="p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h2 className="font-semibold text-text-primary">Areas for Improvement</h2>
            </div>
            <ul className="space-y-3">
              {feedback.areas_for_improvement.map((area, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-start gap-2.5 text-sm text-text-muted"
                >
                  <span className="mt-0.5 shrink-0 text-accent-purple">◆</span>
                  {area}
                </motion.li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        {/* ── CTAs ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-4 pt-2 pb-8"
        >
          <GradientButton
            id="retake-interview-btn"
            size="lg"
            onClick={onRetake}
          >
            <span>🔄</span>
            Retake Interview
          </GradientButton>

          <GradientButton
            id="download-pdf-btn"
            size="lg"
            variant="ghost"
            onClick={handleDownloadPDF}
          >
            <span>📥</span>
            Download PDF Report
          </GradientButton>
        </motion.div>
      </div>
    </motion.main>
  );
}
