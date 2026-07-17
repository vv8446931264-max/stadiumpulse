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
}: IncidentQueueProps) {
  // Sort: open first, then by priority desc, then by createdAt desc
  const sorted = [...incidents].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.createdAt - a.createdAt;
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-[#93A4BF]">
        <p className="text-lg font-medium">All clear.</p>
        <p className="text-sm mt-1">No incidents reported yet.</p>
      </div>
    );
  }

  const allResolved = sorted.every((inc) => inc.status === "resolved");
  if (allResolved) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-[#34D399]">✓ All clear.</p>
        <p className="text-sm mt-1 text-[#93A4BF]">No open incidents.</p>
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
            className={`rounded-lg border p-4 transition-all duration-300 ${
              isResolved
                ? "bg-[#121A2B]/50 border-[#1e293b]/50 opacity-60"
                : "bg-[#121A2B] border-[#1e293b]"
            } ${
              isTracked
                ? "ring-2 ring-[#22D3EE] border-[#22D3EE]/50"
                : isNewest
                ? "ring-2 ring-[#22D3EE]/50 animate-pulse"
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
                    <span className="inline-flex items-center rounded-full bg-[#22D3EE] px-2 py-0.5 text-[10px] font-bold text-[#0B1220]">
                      YOUR REPORT
                    </span>
                  )}
                  <CategoryBadge category={incident.category} />
                  <SeverityBadge severity={incident.severity} />
                  <span className="text-xs text-[#93A4BF]">
                    {zoneLabel(incident.zone)}
                  </span>
                  <SourceBadge source={incident.source} />
                  {isResolved && (
                    <span className="text-xs text-[#34D399] font-medium">
                      ✓ Resolved
                    </span>
                  )}
                </div>

                {/* Summary */}
                <p className="text-sm text-[#E6EDF7]">{incident.summary_en}</p>

                {/* Action */}
                <p className="text-xs text-[#93A4BF]">
                  <span className="text-[#22D3EE]">→</span>{" "}
                  {incident.recommended_action}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-[#93A4BF]">
                    <span>{incident.detected_language}</span>
                    <span>{timeAgo(incident.createdAt)}</span>
                  </div>

                  {!isResolved && (
                    <button
                      onClick={() => onResolve(incident.id)}
                      className="text-xs px-3 py-1 rounded bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/25 border border-[#34D399]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#34D399]"
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
