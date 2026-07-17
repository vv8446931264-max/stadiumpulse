import type { Category, HeatLevel, Incident, Zone } from "./schema";
import { ZONES } from "./schema";

/**
 * Weight assigned to each incident category when computing priority.
 * Higher weight = more operationally urgent category.
 * source: internal rubric aligned with FIFA stadium safety protocols.
 */
export const CATEGORY_WEIGHT: Record<Category, number> = {
  medical: 25,
  security: 25,
  crowding: 20,
  accessibility: 15,
  lost_person: 12,
  transport: 10,
  facility: 8,
  sustainability: 10, // ESTIMATE: same as transport — environmental issues need prompt attention
  other: 5,
} as const;

/**
 * Clamp a number to the range [min, max].
 * @param value - The value to clamp.
 * @param min - Minimum bound (inclusive).
 * @param max - Maximum bound (inclusive).
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute the deterministic priority score for an incident.
 *
 * Formula: `clamp(severity * 15 + CATEGORY_WEIGHT[category] + zoneBonus, 0, 100)`
 *
 * The zone bonus (+5) activates when there are 3 or more other open
 * incidents in the same zone, signaling a developing hotspot.
 *
 * AI parses, code calculates — the LLM never does arithmetic.
 *
 * @param severity - Severity rating (1–5) from AI triage.
 * @param category - Incident category from AI triage.
 * @param openIncidentsInSameZone - Count of other open incidents in the same zone.
 * @returns Priority score (0–100).
 */
export function computePriority(
  severity: number,
  category: Category,
  openIncidentsInSameZone: number
): number {
  const base = severity * 15 + CATEGORY_WEIGHT[category];
  const zoneBonus = openIncidentsInSameZone >= 3 ? 5 : 0;
  return clamp(base + zoneBonus, 0, 100);
}

/**
 * Determine the heat level for a zone based on cumulative severity
 * of all open incidents in that zone.
 *
 * Thresholds:
 * - 0 → "calm"
 * - 1–4 → "busy"
 * - 5–9 → "high"
 * - ≥10 → "critical"
 *
 * @param load - Sum of severity values for open incidents in the zone.
 * @returns The heat level string.
 */
export function getHeatLevel(load: number): HeatLevel {
  if (load <= 0) return "calm";
  if (load <= 4) return "busy";
  if (load <= 9) return "high";
  return "critical";
}

/** Data for a single zone in the heat grid. */
export interface ZoneHeatData {
  zone: Zone;
  load: number;
  level: HeatLevel;
  openCount: number;
}

/**
 * Compute heat data for all zones from a list of incidents.
 *
 * For each zone, sums the severity of all open incidents and
 * determines the heat level.
 *
 * @param incidents - All incidents (open and resolved).
 * @returns Array of heat data for all 8 zones.
 */
export function computeZoneHeat(incidents: Incident[]): ZoneHeatData[] {
  return ZONES.map((zone) => {
    const openInZone = incidents.filter(
      (inc) => inc.zone === zone && inc.status === "open"
    );
    const load = openInZone.reduce((sum, inc) => sum + inc.severity, 0);
    return {
      zone,
      load,
      level: getHeatLevel(load),
      openCount: openInZone.length,
    };
  });
}

/**
 * Count open incidents in a specific zone, excluding a given incident ID.
 * Used when computing priority for a new incident — we don't count itself.
 *
 * @param incidents - All current incidents.
 * @param zone - The zone to count.
 * @param excludeId - Optional incident ID to exclude from the count.
 * @returns Number of open incidents in the zone.
 */
export function countOpenInZone(
  incidents: Incident[],
  zone: string,
  excludeId?: string
): number {
  return incidents.filter(
    (inc) =>
      inc.zone === zone &&
      inc.status === "open" &&
      inc.id !== excludeId
  ).length;
}
