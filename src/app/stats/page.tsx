"use client";

import { useState, useEffect } from "react";
import { useIncidents } from "@/lib/useIncidents";
import { CATEGORY_LABELS, ZONE_LABELS, CATEGORIES, ZONES } from "@/lib/schema";

/**
 * Analytics page showing incident statistics.
 * Pure client-side — reads from the same localStorage store.
 */
export default function StatsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
    });
  }, []);

  const incidents = useIncidents();

  const total = incidents.length;
  const open = incidents.filter((i) => i.status === "open").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const avgSeverity =
    total > 0
      ? (incidents.reduce((sum, i) => sum + i.severity, 0) / total).toFixed(1)
      : "0";
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category breakdown
  const byCat = CATEGORIES.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    count: incidents.filter((i) => i.category === cat).length,
  })).sort((a, b) => b.count - a.count);

  const maxCatCount = Math.max(1, ...byCat.map((c) => c.count));

  // Zone breakdown
  const byZone = ZONES.map((zone) => {
    const zoneInc = incidents.filter((i) => i.zone === zone);
    const avg =
      zoneInc.length > 0
        ? (zoneInc.reduce((s, i) => s + i.severity, 0) / zoneInc.length).toFixed(1)
        : "0";
    return {
      zone,
      label: ZONE_LABELS[zone],
      count: zoneInc.length,
      avgSeverity: parseFloat(avg),
    };
  }).sort((a, b) => b.avgSeverity - a.avgSeverity);

  // Language diversity and counts
  const langCounts = incidents.reduce((acc, curr) => {
    const lang = curr.detected_language || "Unknown";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

  if (!isMounted) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 animate-pulse">
        <div className="mb-6">
          <div className="h-8 w-64 bg-[#1e293b] rounded mb-2"></div>
          <div className="h-4 w-96 bg-[#1e293b] rounded"></div>
        </div>

        {/* Skeleton summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-4 h-24">
              <div className="h-3 w-24 bg-[#1e293b] rounded mb-3"></div>
              <div className="h-6 w-12 bg-[#1e293b] rounded"></div>
            </div>
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-5 h-64">
              <div className="h-4 w-40 bg-[#1e293b] rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-[#1e293b] rounded"></div>
                <div className="h-4 w-full bg-[#1e293b] rounded"></div>
                <div className="h-4 w-full bg-[#1e293b] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
          Incident <span className="text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Analytics</span>
        </h1>
        <p className="text-sm text-[#CBD5E1] mt-1 font-medium">
          Operational intelligence derived from real-time triage data
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Incidents" value={String(total)} color="text-[#F8FAFC]" />
        <SummaryCard label="Open" value={String(open)} color="text-[#F59E0B]" />
        <SummaryCard label="Resolved" value={String(resolved)} color="text-[#34D399]" />
        <SummaryCard label="Avg Severity" value={avgSeverity} color="text-[#22D3EE]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-[#121A2B]/85 backdrop-blur-md rounded-xl border border-[#1e293b] p-5 shadow-lg hover:border-[#22D3EE]/25 transition-all">
          <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider mb-4">
            Incidents by Category
          </h2>
          {total === 0 ? (
            <div className="text-center py-8 text-[#93A4BF] text-sm">No incident categories recorded.</div>
          ) : (
            <div className="space-y-3">
              {byCat.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#F8FAFC] font-medium">{item.label}</span>
                    <span className="text-[#22D3EE] font-bold">{item.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#0B1220] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#22D3EE]/60 to-[#22D3EE] rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / maxCatCount) * 100}%` }}
                      role="progressbar"
                      aria-valuenow={item.count}
                      aria-valuemax={maxCatCount}
                      aria-label={`${item.label}: ${item.count} incidents`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone breakdown */}
        <div className="bg-[#121A2B]/85 backdrop-blur-md rounded-xl border border-[#1e293b] p-5 shadow-lg hover:border-[#22D3EE]/25 transition-all">
          <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider mb-4">
            Average Severity by Zone
          </h2>
          {total === 0 ? (
            <div className="text-center py-8 text-[#93A4BF] text-sm">No incidents mapped by zone.</div>
          ) : (
            <div className="space-y-3">
              {byZone.map((item) => (
                <div key={item.zone}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#F8FAFC] font-medium">{item.label}</span>
                    <span className="text-[#CBD5E1] font-medium">
                      {item.avgSeverity > 0 ? `${item.avgSeverity} avg` : "—"}
                      <span className="ml-2 text-[#CBD5E1]/60">({item.count} total)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#0B1220] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.avgSeverity >= 4
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : item.avgSeverity >= 3
                            ? "bg-gradient-to-r from-amber-500 to-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      }`}
                      style={{ width: `${(item.avgSeverity / 5) * 100}%` }}
                      role="progressbar"
                      aria-valuenow={item.avgSeverity}
                      aria-valuemax={5}
                      aria-label={`${item.label}: average severity ${item.avgSeverity}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolution rate */}
        <div className="bg-[#121A2B]/85 backdrop-blur-md rounded-xl border border-[#1e293b] p-5 shadow-lg hover:border-[#22D3EE]/25 transition-all">
          <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider mb-4">
            Resolution Rate
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="3"
                  strokeDasharray={`${resolutionRate}, 100`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold text-[#34D399]">
                  {resolutionRate}%
                </span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-[#F8FAFC] font-semibold text-base">
                {resolved} of {total} resolved
              </p>
              <p className="text-[#CBD5E1] text-xs mt-1">
                {open} still actively managed in the queue
              </p>
            </div>
          </div>
        </div>

        {/* Diversity & Coverage */}
        <div className="bg-[#121A2B]/85 backdrop-blur-md rounded-xl border border-[#1e293b] p-5 shadow-lg hover:border-[#22D3EE]/25 transition-all">
          <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider mb-4">
            Diversity & Coverage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 border-r border-[#1e293b]/50 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#CBD5E1]">Languages detected</span>
                <span className="text-sm font-bold text-[#22D3EE]">
                  {sortedLangs.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#CBD5E1]">Categories covered</span>
                <span className="text-sm font-bold text-[#22D3EE]">
                  {new Set(incidents.map((i) => i.category)).size} / {CATEGORIES.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#CBD5E1]">Zones with incidents</span>
                <span className="text-sm font-bold text-[#22D3EE]">
                  {new Set(incidents.filter((i) => i.zone !== "unknown").map((i) => i.zone)).size} / {ZONES.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#CBD5E1]">High severity (4-5)</span>
                <span className="text-sm font-bold text-red-400 animate-pulse">
                  {incidents.filter((i) => i.severity >= 4).length}
                </span>
              </div>
            </div>

            <div className="pl-0 md:pl-2">
              <p className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-2">Detected Languages</p>
              {sortedLangs.length === 0 ? (
                <p className="text-xs text-[#CBD5E1] italic">No language data recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {sortedLangs.map(([lang, count]) => {
                    const flag = getLangFlag(lang);
                    return (
                      <span key={lang} className="inline-flex items-center gap-1 rounded bg-[#0B1220] border border-[#1e293b] px-2 py-0.5 text-xs text-[#F8FAFC]">
                        <span>{flag}</span>
                        <span className="capitalize">{lang}</span>
                        <span className="text-[10px] text-[#22D3EE] font-bold ml-1">{count}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getLangFlag(lang: string): string {
  const flags: Record<string, string> = {
    english: "🇺🇸",
    spanish: "🇪🇸",
    hindi: "🇮🇳",
    arabic: "🇸🇦",
    french: "🇫🇷",
    german: "🇩🇪",
    japanese: "🇯🇵",
    chinese: "🇨🇳",
    portuguese: "🇧🇷",
    italian: "🇮🇹",
    russian: "🇷🇺",
    korean: "🇰🇷",
  };
  return flags[lang.toLowerCase()] ?? "🌐";
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#121A2B]/85 backdrop-blur-md rounded-xl border border-[#1e293b] p-4 shadow-lg hover:scale-[1.02] hover:border-[#22D3EE]/20 transition-all duration-300">
      <p className="text-xs text-[#CBD5E1] font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-extrabold mt-2 ${color} tracking-tight`}>{value}</p>
    </div>
  );
}
