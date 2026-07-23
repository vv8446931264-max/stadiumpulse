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
    <div className="bg-[#121A2B]/85 backdrop-blur-md rounded-xl border border-[#1e293b] p-5 sm:p-6 hover:border-[#22D3EE]/25 transition-all">
      <h2 className="text-sm font-bold text-[#F8FAFC]">
        <span aria-hidden="true">🧭</span> Need directions instead?
      </h2>
      <p className="mt-1 text-xs text-[#CBD5E1] font-medium">
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
          className="flex-1 min-w-0 rounded-lg bg-[#0B1220] border border-[#1e293b] text-[#F8FAFC] placeholder-[#CBD5E1]/60 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          aria-busy={loading}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-[#1e293b] text-[#22D3EE] hover:bg-[#22D3EE]/25 border border-[#22D3EE]/20 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] transition-all active:scale-95"
        >
          {loading ? "…" : "Ask"}
        </button>
      </form>
      {answer && (
        <p role="status" className="mt-3 text-sm text-[#F8FAFC] bg-[#0B1220]/50 border border-[#1e293b]/50 p-2.5 rounded-lg font-medium leading-relaxed">
          <span className="text-[#22D3EE] font-bold" aria-hidden="true">
            →{" "}
          </span>
          {answer}
        </p>
      )}
    </div>
  );
}
