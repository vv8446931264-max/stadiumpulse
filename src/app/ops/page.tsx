"use client";

import { useState, useEffect, useCallback } from "react";
import IncidentQueue from "@/components/IncidentQueue";
import StadiumMap from "@/components/StadiumMap";
import {
  resolveIncident,
  addBulkIncidents,
  resetToSeeds,
  consumeLastSubmitted,
} from "@/lib/store";
import { useIncidents } from "@/lib/useIncidents";
import { computeZoneHeat } from "@/lib/engine";
import { MATCHDAY_SIMULATION } from "@/lib/seed";
import { ZONE_LABELS } from "@/lib/schema";
import type { Zone } from "@/lib/schema";

/**
 * Ops Command dashboard.
 *
 * Left: incident queue sorted by priority (open first).
 * Right: 4×2 zone heat grid.
 * Toolbar: "Simulate matchday" and "Reset demo data" buttons.
 * aria-live region announces new incidents.
 */
export default function OpsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
    });
  }, []);

  // Live from the store — updates on mutation and cross-tab writes.
  const incidents = useIncidents();
  const [newestId, setNewestId] = useState<string | undefined>();
  const [trackedId, setTrackedId] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // If the fan just filed a report and clicked "Track it", highlight and
  // scroll to their exact incident so it never gets lost in the queue.
  useEffect(() => {
    const id = consumeLastSubmitted();
    if (!id) return;
    // Defer the state updates out of the effect body (avoids cascading renders).
    queueMicrotask(() => {
      setTrackedId(id);
      setNewestId(id);
      setAnnouncement("Your report is highlighted in the queue.");
    });
    // Wait for the queue to render, then scroll the card into view.
    const t = setTimeout(() => {
      document
        .getElementById(`incident-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const handleResolve = useCallback((id: string) => {
    resolveIncident(id);
  }, []);

  const handleSimulate = useCallback(() => {
    const updated = addBulkIncidents(MATCHDAY_SIMULATION);
    if (updated.length > 0) {
      setNewestId(updated[0].id);
      const first = updated[0];
      setAnnouncement(
        `New ${first.category} incident, priority ${first.priority}, ${first.zone}.`
      );
      setTimeout(() => setNewestId(undefined), 2000);
    }
  }, []);

  const handleReset = useCallback(() => {
    resetToSeeds();
    setNewestId(undefined);
    setAnnouncement("Demo data has been reset.");
  }, []);

  const heatData = computeZoneHeat(incidents);
  const openCount = incidents.filter((i) => i.status === "open").length;
  const visibleIncidents = selectedZone
    ? incidents.filter((i) => i.zone === selectedZone)
    : incidents;

  const handleZoneSelect = useCallback((zone: Zone | null) => {
    setSelectedZone(zone);
    setAnnouncement(
      zone ? `Queue filtered to ${ZONE_LABELS[zone]}.` : "Zone filter cleared."
    );
  }, []);

  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="h-8 w-64 bg-[#1e293b] rounded mb-2"></div>
            <div className="h-4 w-48 bg-[#1e293b] rounded"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-[#1e293b] rounded-lg"></div>
            <div className="h-10 w-32 bg-[#1e293b] rounded-lg"></div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-5 w-32 bg-[#1e293b] rounded mb-3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#121A2B] rounded-lg border border-[#1e293b] p-4 h-32">
                  <div className="flex gap-3 h-full">
                    <div className="w-12 h-12 bg-[#1e293b] rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/4 bg-[#1e293b] rounded"></div>
                      <div className="h-4 w-3/4 bg-[#1e293b] rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-5 w-36 bg-[#1e293b] rounded mb-3"></div>
            <div className="bg-[#121A2B] rounded-xl border border-[#1e293b] p-3 h-80">
              <div className="w-full h-full bg-[#1e293b] rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
            Ops Command — <span className="text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Live Queue</span>
          </h1>
          <p className="text-sm font-semibold text-[#CBD5E1] mt-1">
            {openCount} open incident{openCount !== 1 ? "s" : ""} across{" "}
            {heatData.filter((z) => z.openCount > 0).length} zones
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex gap-3">
          <button
            onClick={handleSimulate}
            className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#22D3EE]/15 text-[#22D3EE] hover:bg-[#22D3EE]/25 border border-[#22D3EE]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#22D3EE] active:scale-95"
            aria-label="Simulate matchday by adding 5 test incidents"
          >
            ⚡ Simulate matchday
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#1e293b] text-[#E2E8F0] hover:text-[#F8FAFC] hover:bg-[#1e293b]/80 border border-[#1e293b] transition-all focus:outline-none focus:ring-2 focus:ring-[#E2E8F0] active:scale-95"
            aria-label="Reset all incidents to demo data"
          >
            Reset demo data
          </button>
        </div>
      </div>

      {/* aria-live announcement region */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Main content: queue + heat grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident queue — takes 2/3 */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider mb-3">
            Priority Queue
          </h2>
          {selectedZone && (
            <button
              onClick={() => handleZoneSelect(null)}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-xs font-bold text-[#22D3EE] hover:bg-[#22D3EE]/20 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
              aria-label={`Clear zone filter ${ZONE_LABELS[selectedZone]}`}
            >
              Filtering: {ZONE_LABELS[selectedZone]} ✕
            </button>
          )}
          <IncidentQueue
            incidents={visibleIncidents}
            onResolve={handleResolve}
            newestId={newestId}
            trackedId={trackedId}
          />
        </div>

        {/* Live stadium map — takes 1/3 */}
        <div>
          <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider mb-3">
            Live Stadium Map
          </h2>
          <div className="p-3 rounded-xl bg-[#121A2B]/85 backdrop-blur-md border border-[#1e293b]">
            <StadiumMap
              heatData={heatData}
              selectedZone={selectedZone}
              onZoneSelect={handleZoneSelect}
            />
            <p className="mt-2 text-center text-[10px] text-[#CBD5E1] font-semibold">
              Tap a zone to filter the queue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
