"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import ReportForm from "@/components/ReportForm";
import type { TriageResult, TriageMeta, Incident } from "@/lib/schema";
import { addIncident } from "@/lib/store";
import { computePriority, countOpenInZone } from "@/lib/engine";
import { readIncidents } from "@/lib/store";

/**
 * Home page — incident report intake.
 *
 * Hero with stadium background → report form → how it works (with illustrations).
 */
export default function HomePage() {
  const [, setLastIncident] = useState<Incident | null>(null);

  const handleTriageComplete = useCallback(
    (result: TriageResult, meta: TriageMeta, originalText: string) => {
      const currentIncidents = readIncidents();
      const openInZone = countOpenInZone(currentIncidents, result.zone);
      const priority = computePriority(result.severity, result.category, openInZone);

      const incident: Incident = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        status: "open",
        priority,
        source: meta.fallback ? "fallback" : "user",
        originalText,
      };

      addIncident(incident);
      setLastIncident(incident);
    },
    []
  );

  return (
    <div>
      {/* Hero section with looping stadium video */}
      <section className="relative overflow-hidden">
        {/* Background video (falls back to the still poster) */}
        <div className="absolute inset-0 z-0">
          <video
            className="h-full w-full object-cover opacity-40 motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-stadium.jpg"
            aria-hidden="true"
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
          {/* Poster shown when reduced-motion is preferred */}
          <Image
            src="/hero-stadium.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
            aria-hidden="true"
            className="hidden object-cover opacity-40 motion-reduce:block"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220]/70 via-[#0B1220]/85 to-[#0B1220]" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-12">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-xs font-medium text-[#22D3EE]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22D3EE] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22D3EE]" />
              </span>
              Live · FIFA World Cup 2026
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
              <span className="text-[#22D3EE]">Stadium</span>Pulse
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-[#E6EDF7]/90">
              See a problem? Tell us — in any language.
            </p>
            <p className="mt-2 text-[#93A4BF] text-sm sm:text-base max-w-lg mx-auto">
              Type it or say it. The ops team is alerted in seconds.
            </p>
          </div>

          <div className="bg-[#121A2B]/90 backdrop-blur-sm rounded-xl border border-[#1e293b] p-6 sm:p-8 shadow-2xl shadow-[#22D3EE]/10">
            <ReportForm onTriageComplete={handleTriageComplete} />
          </div>

          {/* Live-ops stat chips — proof, after the action */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            {[
              ["8", "zones monitored"],
              ["100+", "languages"],
              ["< 3s", "to triage"],
              ["24/7", "ops coverage"],
            ].map(([stat, label]) => (
              <span
                key={label}
                className="rounded-lg border border-[#1e293b] bg-[#121A2B]/70 px-3 py-1.5 backdrop-blur-sm"
              >
                <span className="font-bold text-[#E6EDF7]">{stat}</span>{" "}
                <span className="text-[#93A4BF]">{label}</span>
              </span>
            ))}
          </div>

          <p className="mt-4 text-center text-sm text-[#93A4BF]">
            Running ops?{" "}
            <a
              href="/ops"
              className="font-medium text-[#22D3EE] hover:underline"
            >
              Open the live Ops Command dashboard →
            </a>
          </p>
        </div>
      </section>

      {/* How it works — with generated illustrations */}
      <section className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <h2 className="text-center text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-8">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="group rounded-xl bg-[#121A2B] border border-[#1e293b] overflow-hidden hover:border-[#22D3EE]/30 transition-colors">
            <div className="relative h-40 w-full overflow-hidden bg-[#0B1220]">
              <Image
                src="/how-it-works-1.png"
                alt="Multilingual report intake — speech bubbles in Hindi, Arabic, Spanish, Japanese around a phone"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-semibold text-[#E6EDF7]">
                Any language
              </h3>
              <p className="text-xs text-[#93A4BF] mt-1">
                Report in Hindi, Spanish, Arabic, or 100+ languages
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group rounded-xl bg-[#121A2B] border border-[#1e293b] overflow-hidden hover:border-[#22D3EE]/30 transition-colors">
            <div className="relative h-40 w-full overflow-hidden bg-[#0B1220]">
              <Image
                src="/how-it-works-2.png"
                alt="AI triage — unstructured text flows through a neural network and emerges as structured data"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-semibold text-[#E6EDF7]">
                AI triage
              </h3>
              <p className="text-xs text-[#93A4BF] mt-1">
                Gemini extracts category, severity, and recommended action
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group rounded-xl bg-[#121A2B] border border-[#1e293b] overflow-hidden hover:border-[#22D3EE]/30 transition-colors">
            <div className="relative h-40 w-full overflow-hidden bg-[#0B1220]">
              <Image
                src="/how-it-works-3.png"
                alt="Priority scoring — gauge showing score 85 with severity, weight, and zone bonus inputs"
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-sm font-semibold text-[#E6EDF7]">
                Code calculates
              </h3>
              <p className="text-xs text-[#93A4BF] mt-1">
                Deterministic priority — AI parses, code calculates
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
