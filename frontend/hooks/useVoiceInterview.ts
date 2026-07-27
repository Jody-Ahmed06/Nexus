/**
 * useVoiceInterview — Real listen → think → respond AI interview loop.
 *
 * Pipeline:
 *   1. speechSynthesis speaks the AI's question/reply (SPEAKING state)
 *   2. SpeechRecognition listens for the user's answer (LISTENING state)
 *   3. Transcript is sent to /api/chat (Gemini 2.0 Flash) (THINKING state)
 *   4. Gemini's reply is spoken → go to step 2
 *
 * Falls back to direct Gemini API call if the FastAPI backend is offline.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type InterviewStatus = "idle" | "speaking" | "listening" | "thinking";

export interface InterviewMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

export interface UseVoiceInterviewReturn {
  start: (systemPrompt: string) => void;
  stop: () => void;
  status: InterviewStatus;
  isSpeaking: boolean;
  volumeLevel: number;
  isActive: boolean;
  messages: InterviewMessage[];
  isMockMode: false;
}

// ─── Voice picker ─────────────────────────────────────────────────────────

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        /david|mark|george|alex|james|male/i.test(v.name)
    ) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

// ─── Gemini API call ──────────────────────────────────────────────────────
// Tries the FastAPI backend first; falls back to direct Gemini REST API.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY ?? "";

async function askGemini(
  userMessage: string,
  history: InterviewMessage[],
  systemPrompt: string
): Promise<string> {
  // ── Try FastAPI backend first ──
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        history: history.map((m) => ({ role: m.role, content: m.content })),
        system_prompt: systemPrompt,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply as string;
    }
  } catch {
    // Backend offline — fall through to direct Gemini call
  }

  // ── Direct Gemini REST API fallback ──
  const geminiHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const STRICT_SYSTEM =
    "You are Alex, a senior technical interviewer. RULES: " +
    "1) Ask ONE focused question per turn. " +
    "2) Respond DIRECTLY to what the candidate just said — reference it specifically. " +
    "3) If the answer is vague, off-topic, or nonsensical, push back: say 'Could you be more specific?' or 'That doesn't quite answer my question — let me rephrase.' NEVER say 'Excellent' to a bad answer. " +
    "4) Keep replies SHORT: 1-3 sentences + your next question. " +
    "5) After 5-6 exchanges, wrap up warmly. " +
    (systemPrompt ? `\n\nInterview context: ${systemPrompt.slice(0, 400)}` : "");

  const body = {
    system_instruction: { parts: [{ text: STRICT_SYSTEM }] },
    contents: [
      ...geminiHistory,
      { role: "user", parts: [{ text: userMessage }] },
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Could you say that again? I didn't quite catch it."
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useVoiceInterview(): UseVoiceInterviewReturn {
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);

  const isActiveRef = useRef(false);
  const systemPromptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<InterviewMessage[]>([]);

  // Keep messagesRef in sync so async callbacks always read latest history
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Speak a text string, resolve when done ────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.95; // درجة صوت رجالية
      utterance.volume = 1;
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setStatus("speaking");
        volumeIntervalRef.current = setInterval(() => {
          setVolumeLevel(0.3 + Math.random() * 0.7);
        }, 100);
      };

      utterance.onend = () => {
        clearInterval(volumeIntervalRef.current!);
        setVolumeLevel(0);
        resolve();
      };

      utterance.onerror = () => {
        clearInterval(volumeIntervalRef.current!);
        setVolumeLevel(0);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error("SpeechRecognition not supported in this browser."));
        return;
      }

      let isDone = false;
      const startTime = Date.now();
      const MIN_WAIT_MS = 3000;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      setStatus("listening");

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        isDone = true;
        recognition.stop();
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          isDone = true;
          reject(new Error(event.error));
        }
      };

      recognition.onend = () => {
        if (isDone) return; // already resolved/rejected

        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_WAIT_MS) {
          // Browser closed mic too early (no-speech) — silently restart it
          try {
            recognition.start();
          } catch (err) {
            resolve("");
          }
        } else {
          // At least 3 seconds have passed and no voice detected
          isDone = true;
          resolve("");
        }
      };

      try {
        recognition.start();
      } catch (err) {
        resolve("");
      }
    });
  }, []);

  // ── Main conversation loop ────────────────────────────────────────────
  const runLoop = useCallback(
    async (openingQuestion: string) => {
      if (!isActiveRef.current) return;

      // Speak the opening question
      const openingMsg: InterviewMessage = {
        role: "assistant",
        content: openingQuestion,
        timestamp: Date.now(),
      };
      setMessages([openingMsg]);
      messagesRef.current = [openingMsg];
      await speak(openingQuestion);

      // Conversation loop
      while (isActiveRef.current) {
        // 1. Listen
        let userText = "";
        try {
          userText = await listen();
        } catch (err) {
          console.error("[VoiceInterview] Listen error:", err);
          break;
        }

        if (!isActiveRef.current) break;

        // If nothing was heard, give a gentle nudge
        if (!userText.trim()) {
          await speak("I didn't catch that — could you please say your answer?");
          continue;
        }

        // 2. Record user message
        const userMsg: InterviewMessage = {
          role: "user",
          content: userText,
          timestamp: Date.now(),
        };
        const updatedHistory = [...messagesRef.current, userMsg];
        setMessages(updatedHistory);
        messagesRef.current = updatedHistory;

        // 3. Think (call Gemini)
        setStatus("thinking");
        let reply = "";
        try {
          reply = await askGemini(
            userText,
            messagesRef.current,
            systemPromptRef.current
          );
        } catch (err) {
          console.error("[VoiceInterview] Gemini error:", err);
          reply = "I'm having trouble connecting right now. Could you repeat your answer?";
        }

        if (!isActiveRef.current) break;

        // 4. Speak the reply
        const assistantMsg: InterviewMessage = {
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
        };
        const nextHistory = [...messagesRef.current, assistantMsg];
        setMessages(nextHistory);
        messagesRef.current = nextHistory;

        await speak(reply);
      }
    },
    [speak, listen]
  );

  // ── start() ───────────────────────────────────────────────────────────
  const start = useCallback(
    (systemPrompt: string) => {
      isActiveRef.current = true;
      systemPromptRef.current = systemPrompt;
      setIsActive(true);
      setMessages([]);
      messagesRef.current = [];
      setStatus("thinking");

      const OPENING =
        "Hi! I'm Alex, your interviewer today. Let's get started — could you briefly walk me through your background and what drew you to this role?";

      // Wait for voices to load (Chrome quirk)
      const begin = () => {
        runLoop(OPENING);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        begin();
      } else {
        window.speechSynthesis.addEventListener("voiceschanged", begin, {
          once: true,
        });
      }
    },
    [runLoop]
  );

  // ── stop() ────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    isActiveRef.current = false;
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    clearInterval(volumeIntervalRef.current!);
    setIsActive(false);
    setStatus("idle");
    setVolumeLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
      clearInterval(volumeIntervalRef.current!);
    };
  }, []);

  return {
    start,
    stop,
    status,
    isSpeaking: status === "speaking",
    volumeLevel,
    isActive,
    messages,
    isMockMode: false,
  };
}