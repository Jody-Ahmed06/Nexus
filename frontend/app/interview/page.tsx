/**
 * Interview Room — wires together real voice AI + MediaPipe eye tracking.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AvatarCanvas } from "@/components/AvatarCanvas";
import { VideoFeed } from "@/components/VideoFeed";
import { GradientButton } from "@/components/ui/GradientButton";
import { useToast } from "@/components/ui/Toast";
import { useVoiceInterview } from "@/hooks/useVoiceInterview";
import { useEyeTracker } from "@/hooks/useEyeTracker";
import { useInterviewStore } from "@/store/interviewStore";

// Status label config
const STATUS_CONFIG = {
  idle: { label: "Starting…", color: "#6B7280" },
  speaking: { label: "Alex is speaking…", color: "#00FF88" },
  listening: { label: "🎤 Listening — speak now", color: "#9B59FF" },
  thinking: { label: "Thinking…", color: "#FBBF24" },
};

export default function InterviewPage() {
  const router = useRouter();
  const { toast } = useToast();

  const systemPrompt = useInterviewStore((s) => s.systemPrompt);
  const setEyeContactPercent = useInterviewStore((s) => s.setEyeContactPercent);
  const setTranscript = useInterviewStore((s) => s.setTranscript);

  const interview = useVoiceInterview();
  const eyeTracker = useEyeTracker();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── On mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!systemPrompt) {
      router.replace("/");
      return;
    }

    const init = async () => {
      // 1. Webcam
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        toast("Could not access webcam/mic — allow camera permissions.", "error", 6000);
      }

      // 2. Eye tracker
      if (videoRef.current) {
        await eyeTracker.startTracking(videoRef.current);
      }

      // 3. Start voice interview
      interview.start(systemPrompt);

      // 4. Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    };

    init();

    return () => {
      clearInterval(timerRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndInterview = () => {
    clearInterval(timerRef.current!);
    interview.stop();
    eyeTracker.stopTracking();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setEyeContactPercent(eyeTracker.eyeContactPercent);

    // Format the conversation transcript for the scorecard API
    const fullTranscript = interview.messages
      .map((m) => `${m.role === "assistant" ? "Alex" : "Candidate"}: ${m.content}`)
      .join("\n\n");
    setTranscript(fullTranscript || "No conversation recorded.");

    router.push("/scorecard");
  };

  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const secs = String(elapsedSeconds % 60).padStart(2, "0");

  const statusCfg = STATUS_CONFIG[interview.status];

  return (
    <main className="relative min-h-screen bg-bg-base flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(0,255,136,0.04),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-bg-base to-transparent" />
      </div>

      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 right-6 flex items-center justify-between"
      >
        <div className="text-lg font-bold bg-gradient-to-r from-accent-green to-accent-purple bg-clip-text text-transparent">
          Ma2bool.ai
        </div>

        <AnimatePresence>
          {interview.isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE &nbsp;{mins}:{secs}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Central orb ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-12"
      >
        <div className="flex flex-col items-center gap-10">
          {/* Render the 3D Avatar as the main visual - Adjusted width/height & rounded corners for full oval fill */}
          <div style={{ width: '380px', height: '520px', minWidth: '380px', minHeight: '520px', borderRadius: '190px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', position: 'relative', backgroundColor: 'rgba(0,0,0,0.2)', boxShadow: '0 0 80px rgba(0,255,136,0.1)' }}>

            {/* هنا التعديل اللي ضفناه 👇 */}
            <AvatarCanvas isSpeaking={interview.status === "speaking"} />

          </div>

          {/* Live status pill */}
          <motion.div
            key={interview.status}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm"
            style={{
              borderColor: `${statusCfg.color}40`,
              backgroundColor: `${statusCfg.color}10`,
              color: statusCfg.color,
            }}
          >
            {interview.status === "listening" && (
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: statusCfg.color }}
              />
            )}
            {interview.status === "thinking" && (
              <span
                className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: statusCfg.color, borderTopColor: "transparent" }}
              />
            )}
            {statusCfg.label}
          </motion.div>
        </div>

        {/* End button */}
        <GradientButton
          id="end-interview-btn"
          variant="danger"
          size="lg"
          onClick={handleEndInterview}
        >
          <span>⏹</span>
          End Interview
        </GradientButton>
      </motion.div>

      {/* ── Last message transcript ── */}
      <AnimatePresence>
        {interview.messages.length > 0 && (
          <motion.div
            key={interview.messages[interview.messages.length - 1].timestamp}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 text-center"
          >
            <p className="text-sm text-text-muted leading-relaxed line-clamp-3">
              <span className="text-text-primary/50 font-medium mr-2">
                {interview.messages[interview.messages.length - 1].role === "assistant"
                  ? "Alex:"
                  : "You:"}
              </span>
              {interview.messages[interview.messages.length - 1].content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PiP webcam ── */}
      <div className="absolute bottom-6 right-6 z-20">
        <VideoFeed
          videoRef={videoRef}
          eyeContactPercent={eyeTracker.eyeContactPercent}
          isTracking={eyeTracker.isTracking}
          isModelLoading={eyeTracker.isModelLoading}
        />
      </div>

      {/* ── Tip ── */}
      <p className="absolute bottom-6 left-6 text-xs text-text-muted max-w-[200px]">
        💡 Maintain eye contact with your camera for a better score
      </p>
    </main>
  );
}