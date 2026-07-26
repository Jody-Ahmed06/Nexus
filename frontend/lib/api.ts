/**
 * Ma2bool.ai — Backend API Client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ─── Generate System Prompt ───────────────────────────────────────────────────

export interface GeneratePromptResponse {
  system_prompt: string;
  cv_parsed: boolean;
}

export async function generatePrompt(
  cvFile: File | null,
  jobDescription: string
): Promise<GeneratePromptResponse> {
  const formData = new FormData();
  if (cvFile) {
    formData.append("cv_file", cvFile);
  }
  formData.append("job_description", jobDescription);

  const res = await fetch(`${API_BASE}/generate-prompt`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Generate Feedback ────────────────────────────────────────────────────────

export interface FeedbackResponse {
  technical: number;
  communication: number;
  confidence: number;
  eye_contact: number;
  overall: number;
  detailed_feedback: string;
  areas_for_improvement: string[];
}

export async function generateFeedback(
  eyeContactScore: number,
  transcript: string
): Promise<FeedbackResponse> {
  const res = await fetch(`${API_BASE}/generate-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eye_contact_score: eyeContactScore, transcript }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
