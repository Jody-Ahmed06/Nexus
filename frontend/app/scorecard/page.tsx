/**
 * Scorecard Page — fetches feedback from backend and displays the dashboard.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Scorecard } from "@/components/Scorecard";
import { useInterviewStore } from "@/store/interviewStore";
import { generateFeedback } from "@/lib/api";

export default function ScorecardPage() {
  const router = useRouter();
  const { eyeContactPercent, transcript, setFeedback, feedback, reset } = useInterviewStore();
  const [isLoading, setIsLoading] = useState(!feedback);

  useEffect(() => {
    if (feedback) {
      setIsLoading(false);
      return;
    }

    const fetchFeedback = async () => {
      try {
        const data = await generateFeedback(eyeContactPercent, transcript || "");
        // Inject the real eye contact score from MediaPipe
        setFeedback({ ...data, eye_contact: eyeContactPercent });
      } catch (err) {
        console.error("[Scorecard] Failed to fetch feedback:", err);
        // Fallback mock data so the UI is always displayable
        setFeedback({
          technical: 75,
          communication: 70,
          confidence: 78,
          eye_contact: eyeContactPercent,
          overall: 74,
          detailed_feedback:
            "Great effort! You showed a solid foundation. The backend is currently offline, so this is placeholder feedback. Start the FastAPI server and try again for personalised analysis.",
          areas_for_improvement: [
            "Start the FastAPI backend with: uvicorn main:app --reload",
            "Ensure all dependencies are installed: pip install -r requirements.txt",
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [eyeContactPercent, transcript, feedback, setFeedback]);

  const handleRetake = () => {
    reset();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-6">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-lg font-semibold text-text-primary">Analysing your interview…</p>
          <p className="text-sm text-text-muted mt-1">The AI is reviewing your performance</p>
        </motion.div>
      </div>
    );
  }

  if (!feedback) return null;

  return (
    <Scorecard
      feedback={feedback}
      eyeContactPercent={eyeContactPercent}
      onRetake={handleRetake}
    />
  );
}
