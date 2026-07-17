"use client";

import { useState, useCallback } from "react";
import IncidentQueue from "@/components/IncidentQueue";
import StadiumMap from "@/components/StadiumMap";
import { resolveIncident, addBulkIncidents, resetToSeeds } from "@/lib/store";
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
  // Live from the store — updates on mutation and cross-tab writes.
  const incidents = useIncidents();
  const [newestId, setNewestId] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState("");
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Ops Command — <span className="text-[#22D3EE]">Live Queue</span>
          </h1>
          <p className="text-sm text-[#93A4BF] mt-1">
            {openCount} open incident{openCount !== 1 ? "s" : ""} across{" "}
            {heatData.filter((z) => z.openCount > 0).length} zones
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex gap-3">
          <button
            onClick={handleSimulate}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#22D3EE]/15 text-[#22D3EE] hover:bg-[#22D3EE]/25 border border-[#22D3EE]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
            aria-label="Simulate matchday by adding 5 test incidents"
          >
            ⚡ Simulate matchday
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1e293b] text-[#93A4BF] hover:text-[#E6EDF7] hover:bg-[#1e293b]/80 border border-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93A4BF]"
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
          <h2 className="text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-3">
            Priority Queue
          </h2>
          {selectedZone && (
            <button
              onClick={() => handleZoneSelect(null)}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-xs font-medium text-[#22D3EE] hover:bg-[#22D3EE]/20 focus:outline-none focus:ring-2 focus:ring-[#22D3EE]"
              aria-label={`Clear zone filter ${ZONE_LABELS[selectedZone]}`}
            >
              Filtering: {ZONE_LABELS[selectedZone]} ✕
            </button>
          )}
          <IncidentQueue
            incidents={visibleIncidents}
            onResolve={handleResolve}
            newestId={newestId}
          />
        </div>

        {/* Live stadium map — takes 1/3 */}
        <div>
          <h2 className="text-sm font-semibold text-[#93A4BF] uppercase tracking-wider mb-3">
            Live Stadium Map
          </h2>
          <div className="p-3 rounded-xl bg-[#121A2B] border border-[#1e293b]">
            <StadiumMap
              heatData={heatData}
              selectedZone={selectedZone}
              onZoneSelect={handleZoneSelect}
            />
            <p className="mt-2 text-center text-[10px] text-[#93A4BF]">
              Tap a zone to filter the queue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
