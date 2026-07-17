"use client";

import { useIncidents } from "@/lib/useIncidents";
import { CATEGORY_LABELS, ZONE_LABELS, CATEGORIES, ZONES } from "@/lib/schema";

/**
 * Analytics page showing incident statistics.
 * Pure client-side — reads from the same localStorage store.
 *
 * Sections:
 * - Summary cards (total, open, resolved, avg severity)
 * - Incidents by category (CSS bar chart)
 * - Average severity by zone
 * - Resolution rate
 */
export default function StatsPage() {
  // Live from the store — updates on mutation and cross-tab writes.
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

  // Language diversity
  const languages = new Set(incidents.map((i) => i.detected_language));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Incident <span className="text-[#22D3EE]">Analytics</span>
        </h1>
        <p className="text-sm text-[#93A4BF] mt-1">
          Operational intelligence derived from triage data
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Incidents" value={String(total)} color="text-[#E6EDF7]" />
        <SummaryCard label="Open" value={String(open)} color="text-[#F59E0B]" />
        <SummaryCard label="Resolved" value={String(resolved)} color="text-[#34D399]" />
        <SummaryCard label="Avg Severity" value={avgSeverity} color="text-[#22D3EE]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-4">
            Incidents by Category
          </h2>
          <div className="space-y-3">
            {byCat.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#E6EDF7]">{item.label}</span>
                  <span className="text-[#93A4BF]">{item.count}</span>
                </div>
                <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22D3EE] rounded-full transition-all duration-500"
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
        </div>

        {/* Zone breakdown */}
        <div className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-4">
            Average Severity by Zone
          </h2>
          <div className="space-y-3">
            {byZone.map((item) => (
              <div key={item.zone}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#E6EDF7]">{item.label}</span>
                  <span className="text-[#93A4BF]">
                    {item.avgSeverity > 0 ? item.avgSeverity : "—"} avg
                    <span className="ml-2 text-[#93A4BF]/60">({item.count})</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.avgSeverity >= 4
                        ? "bg-[#EF4444]"
                        : item.avgSeverity >= 3
                          ? "bg-[#F59E0B]"
                          : "bg-[#34D399]"
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
        </div>

        {/* Resolution rate */}
        <div className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-4">
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
                <span className="text-lg font-bold text-[#34D399]">
                  {resolutionRate}%
                </span>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-[#E6EDF7]">
                {resolved} of {total} resolved
              </p>
              <p className="text-[#93A4BF] text-xs mt-1">
                {open} still open
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-5">
          <h2 className="text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-4">
            Diversity & Coverage
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#93A4BF]">Languages detected</span>
              <span className="text-sm font-semibold text-[#22D3EE]">
                {languages.size}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#93A4BF]">Categories covered</span>
              <span className="text-sm font-semibold text-[#22D3EE]">
                {new Set(incidents.map((i) => i.category)).size} / {CATEGORIES.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#93A4BF]">Zones with incidents</span>
              <span className="text-sm font-semibold text-[#22D3EE]">
                {new Set(incidents.filter((i) => i.zone !== "unknown").map((i) => i.zone)).size} / {ZONES.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#93A4BF]">High severity (4-5)</span>
              <span className="text-sm font-semibold text-[#EF4444]">
                {incidents.filter((i) => i.severity >= 4).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
    <div className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-4">
      <p className="text-xs text-[#93A4BF]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
