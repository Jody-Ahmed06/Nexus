/**
 * Ma2bool.ai — Global Zustand Store
 * Holds shared interview state across views.
 */
import { create } from "zustand";

export interface FeedbackData {
  technical: number;
  communication: number;
  confidence: number;
  eye_contact: number;
  overall: number;
  detailed_feedback: string;
  areas_for_improvement: string[];
}

interface InterviewStore {
  // Setup phase
  systemPrompt: string | null;
  setSystemPrompt: (prompt: string) => void;

  // Interview phase
  eyeContactPercent: number;
  setEyeContactPercent: (pct: number) => void;
  transcript: string | null;
  setTranscript: (transcript: string) => void;

  // Scorecard phase
  feedback: FeedbackData | null;
  setFeedback: (feedback: FeedbackData) => void;

  // Reset
  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  systemPrompt: null,
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

  eyeContactPercent: 0,
  setEyeContactPercent: (pct) => set({ eyeContactPercent: pct }),

  transcript: null,
  setTranscript: (transcript) => set({ transcript }),

  feedback: null,
  setFeedback: (feedback) => set({ feedback }),

  reset: () =>
    set({
      systemPrompt: null,
      eyeContactPercent: 0,
      transcript: null,
      feedback: null,
    }),
}));
