import { z } from "zod/v4";

/** All stadium zones used for incident location tracking. */
export const ZONES = [
  "north_gate",
  "south_gate",
  "east_stand",
  "west_stand",
  "concourse",
  "fan_zone",
  "transit_hub",
  "parking",
] as const;

/** Human-readable labels for each zone, used in UI dropdowns and display. */
export const ZONE_LABELS: Record<Zone, string> = {
  north_gate: "North Gate",
  south_gate: "South Gate",
  east_stand: "East Stand",
  west_stand: "West Stand",
  concourse: "Concourse",
  fan_zone: "Fan Zone",
  transit_hub: "Transit Hub",
  parking: "Parking",
};

/** All incident categories for triage classification. */
export const CATEGORIES = [
  "medical",
  "security",
  "crowding",
  "accessibility",
  "lost_person",
  "transport",
  "facility",
  "sustainability",
  "other",
] as const;

/** Human-readable labels for each category, used in UI badges. */
export const CATEGORY_LABELS: Record<Category, string> = {
  medical: "Medical",
  security: "Security",
  crowding: "Crowding",
  accessibility: "Accessibility",
  lost_person: "Lost Person",
  transport: "Transport",
  facility: "Facility",
  sustainability: "Sustainability",
  other: "Other",
};

/** A single zone identifier. */
export type Zone = (typeof ZONES)[number];

/** A zone identifier including "unknown" for unresolved locations. */
export type ZoneOrUnknown = Zone | "unknown";

/** A single incident category. */
export type Category = (typeof CATEGORIES)[number];

/**
 * Zod schema for the structured triage result returned by Gemini.
 * Validates all fields strictly — no extra properties allowed.
 */
export const TriageResultSchema = z
  .object({
    category: z.enum(CATEGORIES),
    severity: z.number().int().min(1).max(5),
    zone: z.enum([...ZONES, "unknown"] as const),
    summary_en: z.string().min(3).max(160),
    detected_language: z.string().min(2).max(35),
    recommended_action: z.string().min(3).max(140),
    confidence: z.number().min(0).max(1),
  })
  .strict();

/** Inferred TypeScript type for a validated triage result. */
export type TriageResult = z.infer<typeof TriageResultSchema>;

/** Possible statuses for an incident in the ops queue. */
export type IncidentStatus = "open" | "resolved";

/** Source of an incident — how it entered the system. */
export type IncidentSource = "user" | "seed" | "fallback";

/**
 * A full incident record combining the AI triage result with
 * operational metadata (id, timestamps, priority, status).
 */
export interface Incident extends TriageResult {
  /** Unique identifier (crypto.randomUUID or similar). */
  id: string;
  /** Unix timestamp (ms) when the incident was created. */
  createdAt: number;
  /** Current status in the ops queue. */
  status: IncidentStatus;
  /** Deterministic priority score (0–100) computed by engine.ts. */
  priority: number;
  /** How this incident entered the system. */
  source: IncidentSource;
  /** The original free-text report submitted by the user. */
  originalText: string;
}

/**
 * Zod schema for validating a full Incident record.
 * Used when reading from localStorage to ensure data integrity.
 */
export const IncidentSchema = TriageResultSchema.extend({
  id: z.string().min(1),
  createdAt: z.number(),
  status: z.enum(["open", "resolved"]),
  priority: z.number().min(0).max(100),
  source: z.enum(["user", "seed", "fallback"]),
  originalText: z.string(),
});

/** Metadata about the AI call that produced a triage result. */
export interface TriageMeta {
  /** Whether the result was served from cache. */
  cached: boolean;
  /** Whether a self-correcting retry was needed. */
  retried: boolean;
  /** Whether the deterministic fallback was used. */
  fallback: boolean;
}

/**
 * Zod schema for validating the POST body of /api/triage.
 * Text must be 1–500 characters; zone is optional.
 */
export const TriageRequestSchema = z.object({
  text: z.string().min(1, "Text must be at least 1 character.").max(500, "Text must be at most 500 characters."),
  zone: z.enum([...ZONES] as const).optional(),
});

/** Inferred TypeScript type for a triage request body. */
export type TriageRequest = z.infer<typeof TriageRequestSchema>;

/** Heat level for a zone based on cumulative severity of open incidents. */
export type HeatLevel = "calm" | "busy" | "high" | "critical";

/** Request schema for the fan navigation assistant. */
export const AssistRequestSchema = z.object({
  question: z.string().trim().min(1).max(300),
  zone: z.enum([...ZONES] as const).optional(),
});

/** Response schema for the fan navigation assistant — strict, like triage. */
export const AssistResultSchema = z
  .object({
    answer: z.string().min(1).max(400),
    detected_language: z.string().min(1).max(40),
  })
  .strict();

/** Inferred TypeScript type for an assistant answer. */
export type AssistResult = z.infer<typeof AssistResultSchema>;
