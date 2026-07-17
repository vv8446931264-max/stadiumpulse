import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { SEED_INCIDENTS } from "@/lib/seed";
import type { Incident } from "@/lib/schema";

/** Minimal in-memory localStorage so store.ts runs under Node (no new deps). */
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

const storage = new MemoryStorage();
let store: typeof import("@/lib/store");

beforeAll(async () => {
  // Stub globals BEFORE the store module loads — it branches on `window`.
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", {
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  store = await import("@/lib/store");
});

beforeEach(() => {
  storage.clear();
});

function makeIncident(over: Partial<Incident> = {}): Incident {
  return { ...SEED_INCIDENTS[0], id: crypto.randomUUID(), ...over };
}

describe("store persistence", () => {
  it("addIncident prepends and persists", () => {
    const inc = makeIncident();
    const updated = store.addIncident(inc);
    expect(updated[0].id).toBe(inc.id);
    expect(store.readIncidents().some((i) => i.id === inc.id)).toBe(true);
  });

  it("resolveIncident flips status to resolved", () => {
    const inc = makeIncident({ status: "open" });
    store.addIncident(inc);
    const updated = store.resolveIncident(inc.id);
    expect(updated.find((i) => i.id === inc.id)?.status).toBe("resolved");
  });

  it("caps storage at 200, keeping open incidents over resolved", () => {
    const open = Array.from({ length: 150 }, () =>
      makeIncident({ status: "open" })
    );
    const resolved = Array.from({ length: 100 }, () =>
      makeIncident({ status: "resolved" })
    );
    store.writeIncidents([...open, ...resolved]);
    const stored = store.readIncidents();
    expect(stored.length).toBe(200);
    expect(stored.filter((i) => i.status === "open").length).toBe(150);
  });

  it("resets to seeds when localStorage holds invalid data", () => {
    storage.setItem("stadiumpulse.incidents.v1", "{not json");
    const result = store.readIncidents();
    expect(result.length).toBe(SEED_INCIDENTS.length);
  });
});

describe("store reactivity", () => {
  it("write refreshes the snapshot reference and notifies subscribers", () => {
    store.readIncidents(); // prime: first read of empty storage seeds it (one write)
    const before = store.getIncidentsSnapshot();
    let calls = 0;
    const unsub = store.subscribeIncidents(() => {
      calls += 1;
    });
    store.addIncident(makeIncident());
    expect(calls).toBe(1);
    expect(store.getIncidentsSnapshot()).not.toBe(before);
    unsub();
    store.addIncident(makeIncident());
    expect(calls).toBe(1); // unsubscribed — no further notifications
  });

  it("server snapshot is an empty list (hydration-safe first paint)", () => {
    expect(store.getIncidentsServerSnapshot()).toEqual([]);
  });
});
