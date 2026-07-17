import { describe, it, expect } from "vitest";
import {
  computePriority,
  clamp,
  getHeatLevel,
  computeZoneHeat,
  countOpenInZone,
  CATEGORY_WEIGHT,
} from "../lib/engine";
import type { Incident } from "../lib/schema";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it("clamps to min when value is below", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("clamps to max when value is above", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });
});

describe("computePriority", () => {
  it("computes priority for medical category", () => {
    // severity=5 * 15 + medical=25 + no zone bonus = 100
    expect(computePriority(5, "medical", 0)).toBe(100);
  });

  it("computes priority for other category (lowest weight)", () => {
    // severity=1 * 15 + other=5 = 20
    expect(computePriority(1, "other", 0)).toBe(20);
  });

  it("computes priority for sustainability category", () => {
    // severity=3 * 15 + sustainability=10 = 55
    expect(computePriority(3, "sustainability", 0)).toBe(55);
  });

  it("adds zone bonus when openIncidentsInSameZone >= 3", () => {
    // severity=3 * 15 + crowding=20 + zone bonus=5 = 70
    expect(computePriority(3, "crowding", 3)).toBe(70);
  });

  it("does NOT add zone bonus when openIncidentsInSameZone < 3", () => {
    // severity=3 * 15 + crowding=20 + no bonus = 65
    expect(computePriority(3, "crowding", 2)).toBe(65);
  });

  it("clamps result to maximum 100", () => {
    // severity=5 * 15 + security=25 + zone bonus=5 = 105 → clamped to 100
    expect(computePriority(5, "security", 5)).toBe(100);
  });

  it("clamps result to minimum 0", () => {
    // Even with lowest inputs: severity=1 * 15 + other=5 = 20, can't go below 0
    expect(computePriority(1, "other", 0)).toBeGreaterThanOrEqual(0);
  });

  it("covers all categories without error", () => {
    const categories = Object.keys(CATEGORY_WEIGHT) as Array<keyof typeof CATEGORY_WEIGHT>;
    for (const cat of categories) {
      expect(() => computePriority(3, cat, 0)).not.toThrow();
    }
  });
});

describe("getHeatLevel", () => {
  it("returns 'calm' for load 0", () => {
    expect(getHeatLevel(0)).toBe("calm");
  });

  it("returns 'busy' for load 1", () => {
    expect(getHeatLevel(1)).toBe("busy");
  });

  it("returns 'busy' for load 4", () => {
    expect(getHeatLevel(4)).toBe("busy");
  });

  it("returns 'high' for load 5", () => {
    expect(getHeatLevel(5)).toBe("high");
  });

  it("returns 'high' for load 9", () => {
    expect(getHeatLevel(9)).toBe("high");
  });

  it("returns 'critical' for load 10", () => {
    expect(getHeatLevel(10)).toBe("critical");
  });

  it("returns 'critical' for very high load", () => {
    expect(getHeatLevel(100)).toBe("critical");
  });

  it("returns 'calm' for negative load", () => {
    expect(getHeatLevel(-1)).toBe("calm");
  });
});

describe("computeZoneHeat", () => {
  it("returns heat data for all 8 zones", () => {
    const result = computeZoneHeat([]);
    expect(result).toHaveLength(8);
    expect(result[0].zone).toBe("north_gate");
    expect(result[0].level).toBe("calm");
    expect(result[0].load).toBe(0);
    expect(result[0].openCount).toBe(0);
  });

  it("sums severity of open incidents per zone", () => {
    const incidents: Incident[] = [
      makeIncident({ zone: "north_gate", severity: 3, status: "open" }),
      makeIncident({ zone: "north_gate", severity: 4, status: "open" }),
      makeIncident({ zone: "north_gate", severity: 2, status: "resolved" }), // excluded
    ];
    const result = computeZoneHeat(incidents);
    const northGate = result.find((z) => z.zone === "north_gate")!;
    expect(northGate.load).toBe(7); // 3 + 4
    expect(northGate.level).toBe("high");
    expect(northGate.openCount).toBe(2);
  });
});

describe("countOpenInZone", () => {
  it("counts open incidents in a zone", () => {
    const incidents: Incident[] = [
      makeIncident({ id: "a", zone: "fan_zone", status: "open" }),
      makeIncident({ id: "b", zone: "fan_zone", status: "open" }),
      makeIncident({ id: "c", zone: "fan_zone", status: "resolved" }),
      makeIncident({ id: "d", zone: "north_gate", status: "open" }),
    ];
    expect(countOpenInZone(incidents, "fan_zone")).toBe(2);
  });

  it("excludes a specific incident by ID", () => {
    const incidents: Incident[] = [
      makeIncident({ id: "a", zone: "fan_zone", status: "open" }),
      makeIncident({ id: "b", zone: "fan_zone", status: "open" }),
    ];
    expect(countOpenInZone(incidents, "fan_zone", "a")).toBe(1);
  });
});

/** Helper to create a minimal valid Incident for testing. */
function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    createdAt: Date.now(),
    status: "open",
    priority: 50,
    source: "seed",
    originalText: "test incident",
    category: "other",
    severity: 3,
    zone: "north_gate",
    summary_en: "Test incident summary.",
    detected_language: "English",
    recommended_action: "Test action.",
    confidence: 0.8,
    ...overrides,
  };
}
