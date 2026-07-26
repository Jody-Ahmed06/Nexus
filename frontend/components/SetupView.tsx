/**
 * SetupView — Home page: CV upload + Job Description input.
 */
"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useToast } from "@/components/ui/Toast";
import { useInterviewStore } from "@/store/interviewStore";
import { generatePrompt } from "@/lib/api";

// ─── Decorative background grid SVG ───────────────────────────────────────

function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Radial spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,255,136,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(155,89,255,0.06),transparent)]" />
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SetupView() {
  const router = useRouter();
  const { toast } = useToast();
  const setSystemPrompt = useInterviewStore((s) => s.setSystemPrompt);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop handlers ────────────────────────────────────────────────

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setCvFile(file);
    } else {
      toast("Please upload a PDF file.", "error");
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") {
      setCvFile(file);
    } else if (file) {
      toast("Please upload a PDF file.", "error");
    }
  };

  // Fallback system prompt used when the backend is offline
  const FALLBACK_PROMPT =
    "You are Alex, a senior technical interviewer. Conduct a friendly, structured mock interview. " +
    "Ask one question at a time, probe for depth, and cover background, technical skills, and one behavioural question. " +
    "Keep energy warm and encouraging.";

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      const result = await generatePrompt(cvFile, jobDescription);
      setSystemPrompt(result.system_prompt);
      toast("Profile analysed! Starting interview…", "success", 2000);
      setTimeout(() => router.push("/interview"), 1200);
    } catch {
      // Backend offline — use the built-in fallback and proceed anyway
      setSystemPrompt(FALLBACK_PROMPT);
      toast("Running in full offline mode — backend not detected.", "info", 3000);
      setTimeout(() => router.push("/interview"), 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const jdLength = jobDescription.length;
  const jdMax = 3000;

  return (
    <main className="relative min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      <GridBackground />

      {/* ── Header ── */}
      <motion.div
        className="relative z-10 mb-12 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-green/20 bg-accent-green/5 px-4 py-1.5 text-xs font-medium text-accent-green uppercase tracking-widest">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
          AI-Powered Mock Interviews
        </div>
        <h1 className="text-5xl font-bold text-text-primary md:text-6xl">
          <span className="bg-gradient-to-r from-accent-green via-emerald-300 to-accent-purple bg-clip-text text-transparent">
            Ma2bool.ai
          </span>
        </h1>
        <p className="mt-4 text-lg text-text-muted max-w-md mx-auto leading-relaxed">
          Practice interviews tailored to your CV and dream role.{" "}
          <span className="text-text-primary/70">Real-time AI voice.</span>{" "}
          <span className="text-text-primary/70">Live eye-contact tracking.</span>
        </p>
      </motion.div>

      {/* ── Cards ── */}
      <div className="relative z-10 w-full max-w-4xl grid gap-6 md:grid-cols-2">
        {/* CV Upload */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <GlassCard glow="green" className="p-6 h-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green/10 text-xl">
                📄
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Your CV</h2>
                <p className="text-xs text-text-muted">PDF files only</p>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              id="cv-dropzone"
              role="button"
              tabIndex={0}
              aria-label="Upload CV PDF"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex-1 flex flex-col items-center justify-center gap-3
                rounded-xl border-2 border-dashed p-8 text-center
                cursor-pointer transition-all duration-300
                ${
                  isDragging
                    ? "border-accent-green bg-accent-green/5 scale-[1.01]"
                    : cvFile
                    ? "border-accent-green/40 bg-accent-green/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
                aria-hidden="true"
              />

              <AnimatePresence mode="wait">
                {cvFile ? (
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="text-4xl">✅</div>
                    <p className="font-medium text-accent-green text-sm">
                      {cvFile.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {(cvFile.size / 1024).toFixed(0)} KB — Click to replace
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="text-4xl opacity-40">
                      {isDragging ? "📂" : "📁"}
                    </div>
                    <p className="text-sm font-medium text-text-primary">
                      {isDragging ? "Drop it here!" : "Drag & drop your CV"}
                    </p>
                    <p className="text-xs text-text-muted">or click to browse</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

        {/* Job Description */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <GlassCard glow="purple" className="p-6 h-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-purple/10 text-xl">
                💼
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Job Description</h2>
                <p className="text-xs text-text-muted">Paste the LinkedIn JD below</p>
              </div>
            </div>

            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value.slice(0, jdMax))}
              placeholder="Paste the full job description here. The AI will tailor your interview questions to this exact role and company…"
              rows={10}
              className="flex-1 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-purple/40 focus:bg-white/[0.05] transition-all duration-200"
              aria-label="Job Description"
            />

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                {jdLength > 0
                  ? "AI will analyse this for question generation"
                  : "Optional but highly recommended"}
              </span>
              <span className={jdLength > jdMax * 0.9 ? "text-amber-400" : ""}>
                {jdLength}/{jdMax}
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* ── CTA ── */}
      <motion.div
        className="relative z-10 mt-8 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <GradientButton
          id="start-interview-btn"
          size="lg"
          onClick={handleStartInterview}
          isLoading={isLoading}
          disabled={isLoading}
        >
          <span>🎙</span>
          Start Interview
        </GradientButton>
        <p className="text-xs text-text-muted">
          Webcam & microphone access required when the interview starts
        </p>
      </motion.div>

      {/* ── Feature pills ── */}
      <motion.div
        className="relative z-10 mt-10 flex flex-wrap justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {[
          { icon: "🧠", text: "GPT-4o Interviewer" },
          { icon: "👁", text: "Eye Contact Tracking" },
          { icon: "📊", text: "Instant Scorecard" },
          { icon: "🎙", text: "Real-Time Voice" },
        ].map((pill) => (
          <div
            key={pill.text}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-text-muted"
          >
            <span>{pill.icon}</span>
            {pill.text}
          </div>
        ))}
      </motion.div>
    </main>
  );
}
