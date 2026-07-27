/**
 * useVapi — Vapi Web SDK hook with automatic mock-mode fallback.
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface VapiMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

export interface UseVapiReturn {
  start: (systemPrompt: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  volumeLevel: number;
  isActive: boolean;
  isMockMode: boolean;
  messages: VapiMessage[];
}

// ─── Mock Mode — uses browser speechSynthesis ─────────────────────────────

const MOCK_SCRIPTS = [
  "Hi there! I'm Alex, your AI interviewer today. Could you start by telling me a bit about your background and what drew you to this role?",
  "That's really interesting. Can you walk me through a challenging technical problem you've solved recently, and how you approached it?",
  "Great example. Now, tell me about a time you had to work under pressure to meet a tight deadline. What was your strategy?",
  "How do you approach learning new technologies or frameworks when a project requires it?",
  "That's really helpful context. Last question — do you have any questions for me about the team, the role, or the company culture?",
];

function getEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // البحث عن أصوات رجالي في المتصفح
  return (
    voices.find((v) =>
      v.lang.startsWith("en") &&
      /david|mark|george|alex|james|male/i.test(v.name)
    ) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
}

function useMockVapi(): UseVapiReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<VapiMessage[]>([]);

  const isActiveRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakQuestion = useCallback((index: number) => {
    if (!isActiveRef.current) return;
    if (index >= MOCK_SCRIPTS.length) return;

    const text = MOCK_SCRIPTS[index];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.95; // تنزيل درجة الصوت قليلاً ليكون رجالي
    utterance.volume = 1;

    const voice = getEnglishVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text, timestamp: Date.now() },
      ]);
      intervalRef.current = setInterval(() => {
        setVolumeLevel(0.3 + Math.random() * 0.7);
      }, 100);
    };

    utterance.onend = () => {
      clearInterval(intervalRef.current!);
      setIsSpeaking(false);
      setVolumeLevel(0);
      timeoutRef.current = setTimeout(() => {
        speakQuestion(index + 1);
      }, 8000);
    };

    utterance.onerror = (e) => {
      console.warn("[MockVapi] speechSynthesis error:", e.error);
      clearInterval(intervalRef.current!);
      setIsSpeaking(false);
      setVolumeLevel(0);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const start = useCallback(
    async (_systemPrompt: string) => {
      isActiveRef.current = true;
      setIsActive(true);
      setMessages([]);

      const begin = () => {
        timeoutRef.current = setTimeout(() => speakQuestion(0), 1200);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        begin();
      } else {
        window.speechSynthesis.addEventListener("voiceschanged", begin, {
          once: true,
        });
      }
    },
    [speakQuestion]
  );

  const stop = useCallback(() => {
    isActiveRef.current = false;
    window.speechSynthesis.cancel();
    clearInterval(intervalRef.current!);
    clearTimeout(timeoutRef.current!);
    setIsActive(false);
    setIsSpeaking(false);
    setVolumeLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      window.speechSynthesis.cancel();
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
    };
  }, []);

  return { start, stop, isSpeaking, volumeLevel, isActive, isMockMode: true, messages };
}

// ─── Live Vapi Hook ────────────────────────────────────────────────────────

function useLiveVapi(apiKey: string): UseVapiReturn {
  const vapiRef = useRef<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<VapiMessage[]>([]);

  useEffect(() => {
    let vapiInstance: any = null;

    const initVapi = async () => {
      try {
        const { default: Vapi } = await import("@vapi-ai/web");
        vapiInstance = new Vapi(apiKey);
        vapiRef.current = vapiInstance;

        vapiInstance.on("speech-start", () => setIsSpeaking(true));
        vapiInstance.on("speech-end", () => {
          setIsSpeaking(false);
          setVolumeLevel(0);
        });
        vapiInstance.on("volume-level", (vol: number) => setVolumeLevel(vol));
        vapiInstance.on("call-end", () => {
          setIsActive(false);
          setIsSpeaking(false);
          setVolumeLevel(0);
        });
        vapiInstance.on("message", (msg: any) => {
          if (msg?.type === "transcript" && msg?.transcriptType === "final") {
            setMessages((prev) => [
              ...prev,
              {
                role: msg.role,
                content: msg.transcript,
                timestamp: Date.now(),
              },
            ]);
          }
        });
      } catch (err) {
        console.error("[useVapi] Failed to initialize Vapi:", err);
      }
    };

    initVapi();

    return () => {
      vapiInstance?.stop();
    };
  }, [apiKey]);

  const start = useCallback(async (systemPrompt: string) => {
    if (!vapiRef.current) return;
    setMessages([]);
    setIsActive(true);
    await vapiRef.current.start({
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }],
      },
      voice: {
        provider: "openai",
        voiceId: "echo",
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
    });
  }, []);

  const stop = useCallback(() => {
    vapiRef.current?.stop();
    setIsActive(false);
  }, []);

  return { start, stop, isSpeaking, volumeLevel, isActive, isMockMode: false, messages };
}

// ─── Public Hook ──────────────────────────────────────────────────────────

export function useVapi(): UseVapiReturn {
  const apiKey = process.env.NEXT_PUBLIC_VAPI_KEY;

  const mockResult = useMockVapi();
  const liveResult = useLiveVapi(apiKey ?? "");

  return apiKey ? liveResult : mockResult;
}