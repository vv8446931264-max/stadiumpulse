"use client";

import { useState } from "react";

/** Compact fan Q&A card — asks /api/assist navigation questions in any language. */
export default function AskAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();
      setAnswer(
        data.ok
          ? data.result.answer
          : "Please ask a steward at the nearest gate."
      );
    } catch {
      setAnswer("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#121A2B]/90 backdrop-blur-sm rounded-xl border border-[#1e293b] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[#E6EDF7]">
        <span aria-hidden="true">🧭</span> Need directions instead?
      </h2>
      <p className="mt-1 text-xs text-[#93A4BF]">
        Ask about entrances, facilities, or accessibility — in your language.
      </p>
      <form onSubmit={ask} className="mt-3 flex gap-2">
        <label htmlFor="assist-q" className="sr-only">
          Your question
        </label>
        <input
          id="assist-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          placeholder="Where is the nearest accessible entrance?"
          className="flex-1 min-w-0 rounded-lg bg-[#0B1220] border border-[#1e293b] text-[#E6EDF7] placeholder-[#93A4BF]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          aria-busy={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1e293b] text-[#22D3EE] hover:bg-[#22D3EE]/15 border border-[#22D3EE]/30 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] transition-colors"
        >
          {loading ? "…" : "Ask"}
        </button>
      </form>
      {answer && (
        <p role="status" className="mt-3 text-sm text-[#E6EDF7]">
          <span className="text-[#22D3EE]" aria-hidden="true">
            →{" "}
          </span>
          {answer}
        </p>
      )}
    </div>
  );
}
