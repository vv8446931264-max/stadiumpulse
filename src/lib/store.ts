import { z } from "zod/v4";
import { IncidentSchema } from "./schema";
import type { Incident } from "./schema";
import { SEED_INCIDENTS } from "./seed";

/** LocalStorage key for incident data. */
const STORAGE_KEY = "stadiumpulse.incidents.v1";

/** Maximum number of incidents to store. */
const MAX_INCIDENTS = 200;

/** Zod schema for the stored incident array. */
const StoredIncidentsSchema = z.array(IncidentSchema);

// --- Reactive snapshot (for useSyncExternalStore) ---
// Cached array whose reference only changes on write, so getSnapshot is stable.
let cache: Incident[] | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Stable snapshot of the current incidents (client-only; seeds on server). */
export function getIncidentsSnapshot(): Incident[] {
  if (typeof window === "undefined") return SEED_INCIDENTS;
  if (cache === null) cache = readIncidents();
  return cache;
}

/** Server render always sees an empty list (hydration-safe first paint). */
export function getIncidentsServerSnapshot(): Incident[] {
  return [];
}

/** Subscribe to store changes, including cross-tab writes. */
export function subscribeIncidents(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = readIncidents();
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Read all incidents from localStorage.
 * Validates the entire array with Zod; on parse failure, resets to seed data.
 *
 * @returns The array of stored incidents.
 */
export function readIncidents(): Incident[] {
  if (typeof window === "undefined") return SEED_INCIDENTS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First visit: seed the store
      writeIncidents(SEED_INCIDENTS);
      return SEED_INCIDENTS;
    }

    const parsed = JSON.parse(raw);
    const validated = StoredIncidentsSchema.safeParse(parsed);

    if (validated.success) {
      return validated.data as Incident[];
    }

    // Parse failure: reset to seeds
    console.warn("[store] Invalid localStorage data, resetting to seeds");
    writeIncidents(SEED_INCIDENTS);
    return SEED_INCIDENTS;
  } catch {
    console.warn("[store] Error reading localStorage, resetting to seeds");
    writeIncidents(SEED_INCIDENTS);
    return SEED_INCIDENTS;
  }
}

/**
 * Write incidents to localStorage.
 * Enforces the 200-incident cap by dropping oldest resolved first,
 * then oldest open if still over capacity.
 *
 * @param incidents - The incidents to store.
 */
export function writeIncidents(incidents: Incident[]): void {
  if (typeof window === "undefined") return;

  const open = incidents.filter((inc) => inc.status === "open");
  const resolved = incidents.filter((inc) => inc.status === "resolved");

  // Enforce cap: keep all open first, then fill with newest resolved
  const maxResolved = Math.max(0, MAX_INCIDENTS - open.length);
  const capped = [...open, ...resolved.slice(0, maxResolved)].slice(0, MAX_INCIDENTS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  cache = capped; // refresh snapshot reference so subscribers re-render
  notify();
}

/**
 * Add a new incident to the store.
 *
 * @param incident - The incident to add.
 * @returns The updated incident array.
 */
export function addIncident(incident: Incident): Incident[] {
  const current = readIncidents();
  const updated = [incident, ...current];
  writeIncidents(updated);
  return updated;
}

/**
 * Mark an incident as resolved by ID.
 *
 * @param id - The incident ID to resolve.
 * @returns The updated incident array.
 */
export function resolveIncident(id: string): Incident[] {
  const current = readIncidents();
  const updated = current.map((inc) =>
    inc.id === id ? { ...inc, status: "resolved" as const } : inc
  );
  writeIncidents(updated);
  return updated;
}

/**
 * Reset the store to seed data only.
 *
 * @returns The seed incident array.
 */
export function resetToSeeds(): Incident[] {
  writeIncidents(SEED_INCIDENTS);
  return SEED_INCIDENTS;
}

/**
 * Add multiple incidents with staggered timestamps.
 * Used by the "Simulate matchday" button.
 *
 * @param newIncidents - Incidents without id/createdAt.
 * @returns The updated incident array.
 */
export function addBulkIncidents(
  newIncidents: Omit<Incident, "id" | "createdAt">[]
): Incident[] {
  const current = readIncidents();
  const now = Date.now();
  const withMeta: Incident[] = newIncidents.map((inc, i) => ({
    ...inc,
    id: crypto.randomUUID(),
    createdAt: now - (newIncidents.length - i) * 2000, // Stagger by 2 seconds
  }));
  const updated = [...withMeta, ...current];
  writeIncidents(updated);
  return updated;
}
