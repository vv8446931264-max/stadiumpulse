"use client";

import type { Incident } from "@/lib/schema";
import { ZONE_LABELS } from "@/lib/schema";
import type { ZoneOrUnknown } from "@/lib/schema";
import {
  CategoryBadge,
  SeverityBadge,
  SourceBadge,
  PriorityIndicator,
} from "./StatusBadge";

interface IncidentQueueProps {
  incidents: Incident[];
  onResolve: (id: string) => void;
  /** ID of the most recently added incident — used for entrance animation. */
  newestId?: string;
  /** ID of the report the current fan just filed — gets a "Your report" badge. */
  trackedId?: string;
}

/**
 * Format a relative time string from a timestamp.
 */
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function zoneLabel(zone: ZoneOrUnknown): string {
  if (zone === "unknown") return "Unknown";
  return ZONE_LABELS[zone] ?? zone;
}

/**
 * Incident queue sorted by priority (desc), open first.
 * Each card shows priority, category, severity, zone, summary,
 * recommended action, language, relative time, source badge, and resolve button.
 */
export default function IncidentQueue({
  incidents,
  onResolve,
  newestId,
  trackedId,
}: IncidentQueueProps) {
  // Sort: open first, then by priority desc, then by createdAt desc
  const sorted = [...incidents].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.createdAt - a.createdAt;
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-[#CBD5E1]">
        <p className="text-lg font-semibold">All clear.</p>
        <p className="text-sm mt-1 text-[#CBD5E1]/80">No incidents reported yet.</p>
      </div>
    );
  }

  const allResolved = sorted.every((inc) => inc.status === "resolved");
  if (allResolved) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-[#34D399]">✓ All clear.</p>
        <p className="text-sm mt-1 text-[#CBD5E1]">No open incidents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="Incident queue">
      {sorted.map((incident) => {
        const isNewest = incident.id === newestId;
        const isTracked = incident.id === trackedId;
        const isResolved = incident.status === "resolved";

        return (
          <div
            key={incident.id}
            id={`incident-${incident.id}`}
            role="listitem"
            className={`rounded-lg border p-4 transition-all duration-300 hover:scale-[1.01] ${
              isResolved
                ? "bg-[#121A2B]/40 border-[#1e293b]/50 opacity-60"
                : "bg-[#121A2B]/85 backdrop-blur-md border-[#1e293b] hover:border-[#22D3EE]/30"
            } ${
              isTracked
                ? "ring-2 ring-[#22D3EE] border-[#22D3EE]/50"
                : isNewest
                ? "ring-2 ring-[#22D3EE]/50"
                : ""
            }`}
            style={
              isNewest
                ? { animation: "glow-pulse 1.5s ease-out 1" }
                : undefined
            }
          >
            <div className="flex items-start gap-3">
              {/* Priority number */}
              <PriorityIndicator priority={incident.priority} />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Top row: badges */}
                <div className="flex items-center flex-wrap gap-2">
                  {isTracked && (
                    <span className="inline-flex items-center rounded-full bg-[#22D3EE] px-2 py-0.5 text-[10px] font-extrabold text-[#0B1220] tracking-wider">
                      YOUR REPORT
                    </span>
                  )}
                  <CategoryBadge category={incident.category} />
                  <SeverityBadge severity={incident.severity} />
                  <span className="text-xs text-[#F8FAFC] font-semibold">
                    {zoneLabel(incident.zone)}
                  </span>
                  <SourceBadge source={incident.source} />
                  {isResolved && (
                    <span className="text-xs text-[#34D399] font-bold">
                      ✓ Resolved
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p className="text-sm font-semibold text-[#F8FAFC] leading-relaxed">{incident.summary_en}</p>

                {/* Action */}
                <p className="text-xs text-[#CBD5E1] font-medium">
                  <span className="text-[#22D3EE] font-bold">→</span>{" "}
                  {incident.recommended_action}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-[#CBD5E1]/85 font-medium">
                    <span className="uppercase tracking-wider">{incident.detected_language}</span>
                    <span>{timeAgo(incident.createdAt)}</span>
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => onResolve(incident.id)}
                      className="text-xs px-3 py-1.5 rounded font-bold bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/25 border border-[#34D399]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#34D399] active:scale-95"
                      aria-label={`Mark ${incident.summary_en} as resolved`}
                    >
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
