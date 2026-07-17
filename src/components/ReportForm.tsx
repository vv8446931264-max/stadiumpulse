"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import type { TriageResult, TriageMeta, Zone } from "@/lib/schema";
import { ZONES, ZONE_LABELS, CATEGORY_LABELS } from "@/lib/schema";

const noopSubscribe = () => () => {};
/** True when the browser exposes the Web Speech API (client-only, static). */
function getVoiceSupported() {
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** Minimal typing for the Web Speech API (not in the TS DOM lib). */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: {
    results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
  }) => void;
  onend: () => void;
  onerror: () => void;
  start(): void;
  stop(): void;
}
type SpeechCtor = new () => SpeechRecognitionLike;

/** Example chips in different languages for quick submission. */
const EXAMPLE_CHIPS = [
  { text: "Gate B ke paas bahut bheed hai, log dhakka de rahe hain", lang: "Hindi", flag: "🇮🇳" },
  { text: "La rampa para sillas de ruedas del lado este está bloqueada", lang: "Spanish", flag: "🇲🇽" },
  { text: "فقدت ابني بالقرب من منطقة المشجعين", lang: "Arabic", flag: "🇸🇦" },
  { text: "Long queue at transit hub, buses not arriving", lang: "English", flag: "🇺🇸" },
] as const;

interface ReportFormProps {
  onTriageComplete: (
    result: TriageResult,
    meta: TriageMeta,
    originalText: string
  ) => void;
}

/**
 * Report intake form with free-text input, optional zone picker,
 * multilingual example chips, and triage submission.
 */
export default function ReportForm({ onTriageComplete }: ReportFormProps) {
  const [text, setText] = useState("");
  const [zone, setZone] = useState<Zone | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    result: TriageResult;
    meta: TriageMeta;
  } | null>(null);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Bring the outcome into view — on mobile it renders below the button.
  useEffect(() => {
    if (success || error) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [success, error]);
  // Hydration-safe: false on server, real value after mount.
  const voiceSupported = useSyncExternalStore(
    noopSubscribe,
    getVoiceSupported,
    () => false
  );

  const charCount = text.length;
  const canSubmit = text.trim().length >= 1 && text.length <= 500 && !isLoading;

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: SpeechCtor;
      webkitSpeechRecognition?: SpeechCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = navigator.language || "en-US"; // fan's own language
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setText(transcript.slice(0, 500));
      setSuccess(null);
      setError(null);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const body: { text: string; zone?: Zone } = { text: text.trim() };
      if (zone) body.zone = zone as Zone;

      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't process the report — it was saved for human review.");
        return;
      }

      setSuccess({ result: data.result, meta: data.meta });
      onTriageComplete(data.result, data.meta, text.trim());
      setText("");
      setZone("");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleChipClick(chipText: string) {
    setText(chipText);
    setSuccess(null);
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Text area */}
      <div>
        <label
          htmlFor="report-text"
          className="block text-sm font-medium text-[#E6EDF7] mb-2"
        >
          What&apos;s happening?
        </label>
        <div className="relative">
          <textarea
            id="report-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSuccess(null);
              setError(null);
            }}
            maxLength={500}
            rows={4}
            placeholder="Type or tap the mic — any language works"
            className="w-full rounded-lg bg-[#0B1220] border border-[#1e293b] text-[#E6EDF7] placeholder-[#93A4BF]/60 px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent resize-none transition-shadow"
            aria-describedby="char-counter"
            disabled={isLoading}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isLoading}
              aria-pressed={listening}
              aria-label={listening ? "Stop voice input" : "Report by voice"}
              title={listening ? "Listening… tap to stop" : "Report by voice"}
              className={`absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#22D3EE] ${
                listening
                  ? "bg-[#EF4444]/20 border-[#EF4444]/40 text-[#EF4444] animate-pulse"
                  : "bg-[#121A2B] border-[#1e293b] text-[#93A4BF] hover:text-[#22D3EE] hover:border-[#22D3EE]/40"
              }`}
            >
              {/* Microphone glyph */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </button>
          )}
        </div>
        <div
          id="char-counter"
          className={`text-xs mt-1 text-right ${
            charCount > 450 ? "text-amber-400" : "text-[#93A4BF]"
          }`}
        >
          {charCount}/500
        </div>
      </div>

      {/* Zone picker */}
      <div>
        <label
          htmlFor="report-zone"
          className="block text-sm font-medium text-[#E6EDF7] mb-2"
        >
          Where?{" "}
          <span className="text-[#93A4BF] font-normal">
            (optional — the AI can detect it)
          </span>
        </label>
        <select
          id="report-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value as Zone | "")}
          className="w-full rounded-lg bg-[#0B1220] border border-[#1e293b] text-[#E6EDF7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent transition-shadow"
          disabled={isLoading}
        >
          <option value="">— Auto-detect from text —</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {ZONE_LABELS[z]}
            </option>
          ))}
        </select>
      </div>

      {/* Example chips */}
      <div>
        <p className="text-xs text-[#93A4BF] mb-2">
          No time to type? Tap an example:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip.lang}
              type="button"
              onClick={() => handleChipClick(chip.text)}
              className="px-3 py-1.5 rounded-full text-xs bg-[#1e293b] text-[#93A4BF] hover:text-[#22D3EE] hover:bg-[#22D3EE]/10 border border-[#1e293b] hover:border-[#22D3EE]/30 transition-all"
              disabled={isLoading}
              aria-label={`Fill the form with a ${chip.lang} example report`}
            >
              <span aria-hidden="true">{chip.flag}</span> {chip.lang}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!canSubmit}
        aria-busy={isLoading}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#22D3EE] text-[#0B1220] hover:bg-[#22D3EE]/90 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 focus:ring-offset-[#121A2B]"
      >
        {isLoading ? "Triaging…" : "Send report"}
      </button>

      {/* Error state */}
      {error && (
        <div
          ref={resultRef}
          role="alert"
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      {/* Outcome — plain language for the fan; ops numbers stay on the dashboard */}
      {success &&
        (success.meta.fallback ? (
          <div
            ref={resultRef}
            role="status"
            className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1.5"
          >
            <p className="text-amber-400 font-semibold text-base">
              ✓ Report received
            </p>
            <p className="text-sm text-[#E6EDF7]">
              A dispatcher will review it right away.
            </p>
            <p className="text-xs text-[#93A4BF]">
              AI triage was unavailable, so your report went straight to staff.
            </p>
          </div>
        ) : (
          <div
            ref={resultRef}
            role="status"
            className="p-4 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/30 space-y-2"
          >
            <p className="text-[#22D3EE] font-semibold text-base">
              ✓ Help is on the way
            </p>
            <p className="text-sm text-[#E6EDF7]">
              {success.result.recommended_action}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#93A4BF]">
              <span>{CATEGORY_LABELS[success.result.category]}</span>
              {success.result.zone !== "unknown" && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{ZONE_LABELS[success.result.zone]}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>Understood in {success.result.detected_language}</span>
            </div>
            <a
              href="/ops"
              className="inline-block text-xs text-[#22D3EE] hover:underline"
            >
              Track it on the Ops Dashboard →
            </a>
          </div>
        ))}
    </form>
  );
}
