import { useSyncExternalStore } from "react";
import {
  subscribeIncidents,
  getIncidentsSnapshot,
  getIncidentsServerSnapshot,
} from "./store";

/**
 * Live incidents from the store. Updates on same-tab mutations and cross-tab
 * writes. Hydration-safe: server/first-client render sees an empty list.
 */
export function useIncidents() {
  return useSyncExternalStore(
    subscribeIncidents,
    getIncidentsSnapshot,
    getIncidentsServerSnapshot
  );
}
