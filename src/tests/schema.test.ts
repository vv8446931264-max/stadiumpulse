import { describe, it, expect } from "vitest";
import {
  TriageResultSchema,
  IncidentSchema,
  TriageRequestSchema,
  ZONES,
  CATEGORIES,
} from "../lib/schema";

describe("TriageResultSchema", () => {
  const validResult = {
    category: "crowding" as const,
    severity: 4,
    zone: "north_gate" as const,
    summary_en: "Severe overcrowding near Gate B.",
    detected_language: "Hindi",
    recommended_action: "Send crowd stewards to Gate B.",
    confidence: 0.9,
  };

  it("accepts a valid triage result", () => {
    const parsed = TriageResultSchema.safeParse(validResult);
    expect(parsed.success).toBe(true);
  });

  it("rejects severity 0 (below minimum)", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, severity: 0 });
    expect(parsed.success).toBe(false);
  });

  it("rejects severity 6 (above maximum)", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, severity: 6 });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-integer severity", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, severity: 3.5 });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown category", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, category: "fire" });
    expect(parsed.success).toBe(false);
  });

  it("accepts sustainability category", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, category: "sustainability" });
    expect(parsed.success).toBe(true);
  });

  it("rejects NaN confidence", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, confidence: NaN });
    expect(parsed.success).toBe(false);
  });

  it("rejects confidence > 1", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, confidence: 1.5 });
    expect(parsed.success).toBe(false);
  });

  it("rejects confidence < 0", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, confidence: -0.1 });
    expect(parsed.success).toBe(false);
  });

  it("accepts zone 'unknown'", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, zone: "unknown" });
    expect(parsed.success).toBe(true);
  });

  it("rejects zone not in the enum", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, zone: "rooftop" });
    expect(parsed.success).toBe(false);
  });

  it("rejects summary_en shorter than 3 characters", () => {
    const parsed = TriageResultSchema.safeParse({ ...validResult, summary_en: "Hi" });
    expect(parsed.success).toBe(false);
  });

  it("rejects summary_en longer than 160 characters", () => {
    const parsed = TriageResultSchema.safeParse({
      ...validResult,
      summary_en: "A".repeat(161),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const parsed = TriageResultSchema.safeParse({
      ...validResult,
      extra_field: "should not be here",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("IncidentSchema", () => {
  const validIncident = {
    id: "test-001",
    createdAt: Date.now(),
    status: "open" as const,
    priority: 75,
    source: "user" as const,
    originalText: "Test incident text",
    category: "medical" as const,
    severity: 4,
    zone: "south_gate" as const,
    summary_en: "Test medical incident.",
    detected_language: "English",
    recommended_action: "Dispatch medics.",
    confidence: 0.95,
  };

  it("accepts a valid incident", () => {
    const parsed = IncidentSchema.safeParse(validIncident);
    expect(parsed.success).toBe(true);
  });

  it("rejects priority > 100", () => {
    const parsed = IncidentSchema.safeParse({ ...validIncident, priority: 101 });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const parsed = IncidentSchema.safeParse({ ...validIncident, source: "api" });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const parsed = IncidentSchema.safeParse({ ...validIncident, status: "pending" });
    expect(parsed.success).toBe(false);
  });
});

describe("TriageRequestSchema", () => {
  it("accepts valid request with text only", () => {
    const parsed = TriageRequestSchema.safeParse({ text: "Help needed" });
    expect(parsed.success).toBe(true);
  });

  it("accepts valid request with text and zone", () => {
    const parsed = TriageRequestSchema.safeParse({ text: "Help needed", zone: "north_gate" });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty text", () => {
    const parsed = TriageRequestSchema.safeParse({ text: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects text > 500 characters", () => {
    const parsed = TriageRequestSchema.safeParse({ text: "A".repeat(501) });
    expect(parsed.success).toBe(false);
  });
});

describe("Constants", () => {
  it("has 8 zones", () => {
    expect(ZONES).toHaveLength(8);
  });

  it("has 9 categories (including sustainability)", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect(CATEGORIES).toContain("sustainability");
  });
});
