import { getGenAI } from "./genai";
import { TriageResultSchema } from "./schema";
import type { TriageMeta, TriageResult, ZoneOrUnknown } from "./schema";
import {
  sanitizeText,
  looksLikeInjection,
  CONFIDENCE_FLOOR,
  INJECTION_GUARD_CLAUSE,
} from "./guardrails";

/**
 * Gemini system prompt for incident triage.
 * Instructs the model to convert free-text reports in any language
 * into a strict JSON triage result.
 */
const SYSTEM_PROMPT = `You are the triage engine for StadiumPulse, an operations tool for FIFA World Cup 2026 stadiums.
Convert one incident report, written in any language, into a single JSON object with EXACTLY these fields:
category: one of "medical","security","crowding","accessibility","lost_person","transport","facility","sustainability","other"
severity: integer 1-5. Rubric: 1 minor inconvenience, 2 needs attention today, 3 needs attention within the hour, 4 urgent risk to people, 5 immediate danger to life or safety.
zone: one of "north_gate","south_gate","east_stand","west_stand","concourse","fan_zone","transit_hub","parking" if the text clearly indicates it, else "unknown". If a zone is provided by the app, prefer it unless the text contradicts it.
summary_en: neutral English summary, max 160 characters.
detected_language: the language of the report (English name or ISO 639-1 code).
recommended_action: one concrete next step for the ops team, max 140 characters. Never give medical diagnoses; for medical incidents the action is dispatching medics.
confidence: 0 to 1, your confidence in this triage.
Output ONLY the JSON object. No markdown, no commentary.

Example input: "Gate B ke paas bahut zyada bheed hai, log dhakka de rahe hain"
Example output: {"category":"crowding","severity":4,"zone":"unknown","summary_en":"Severe overcrowding near Gate B, people pushing.","detected_language":"Hindi","recommended_action":"Send crowd stewards to Gate B and open additional lanes.","confidence":0.9}

Example input: "La rampa para sillas de ruedas del lado este está bloqueada por cajas"
Example output: {"category":"accessibility","severity":3,"zone":"east_stand","summary_en":"Wheelchair ramp on the east side blocked by boxes.","detected_language":"Spanish","recommended_action":"Dispatch staff to clear the east stand ramp immediately.","confidence":0.92}

Example input: "lost my kid near the fan zone, wearing a red argentina shirt"
Example output: {"category":"lost_person","severity":4,"zone":"fan_zone","summary_en":"Child lost near the fan zone, wearing a red Argentina shirt.","detected_language":"English","recommended_action":"Alert fan zone security with description and start lost-child protocol.","confidence":0.95}

Example input: "Overflowing bins and trash everywhere near the food stalls"
Example output: {"category":"sustainability","severity":3,"zone":"unknown","summary_en":"Overflowing bins and litter near food stalls.","detected_language":"English","recommended_action":"Deploy waste management crew and add temporary bins.","confidence":0.88}

${INJECTION_GUARD_CLAUSE}`;

/**
 * Build the deterministic fallback result when Gemini fails.
 * This ensures the user always gets a 200 response — never a 500.
 *
 * @param originalText - The original report text.
 * @param userZone - Optional zone provided by the user.
 * @returns A safe fallback triage result.
 */
function buildFallback(
  originalText: string,
  userZone?: ZoneOrUnknown
): TriageResult {
  return {
    category: "other",
    severity: 3,
    zone: userZone ?? "unknown",
    summary_en: originalText.slice(0, 120) + " (auto-fallback)",
    detected_language: "und",
    recommended_action: "Route to human dispatcher for manual review.",
    confidence: 0,
  };
}

/**
 * Call Gemini to triage an incident report.
 *
 * Flow:
 * 1. Call Gemini with system prompt + user text.
 * 2. JSON.parse → TriageResultSchema.safeParse.
 * 3. On failure: ONE retry with Zod error messages appended.
 * 4. On second failure: deterministic fallback (never a 500).
 *
 * @param text - The free-text incident report (any language).
 * @param zone - Optional zone context from the UI.
 * @returns The triage result and metadata about the AI call.
 */
export async function triageWithGemini(
  text: string,
  zone?: string
): Promise<{ result: TriageResult; meta: TriageMeta }> {
  // Guardrail: sanitize untrusted input, flag injection attempts (non-blocking).
  const cleanText = sanitizeText(text);
  const injectionFlagged = looksLikeInjection(cleanText);
  if (injectionFlagged) {
    console.warn("[ai] Prompt-injection pattern detected in report; treating as data only");
  }

  const ai = getGenAI();
  if (!ai) {
    console.error("[ai] No Gemini backend configured (Vertex AI or API key)");
    return {
      result: buildFallback(cleanText, (zone as ZoneOrUnknown) ?? undefined),
      meta: { cached: false, retried: false, fallback: true, injectionFlagged },
    };
  }

  const userContent = zone
    ? `${cleanText}\n\nApp-provided zone: ${zone}`
    : cleanText;

  try {
    // First attempt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        systemInstruction: SYSTEM_PROMPT,
      },
      contents: userContent,
    });

    const rawText = response.text ?? "";
    const parsed = JSON.parse(rawText);
    const validated = TriageResultSchema.safeParse(parsed);

    if (validated.success) {
      return {
        result: validated.data,
        meta: {
          cached: false,
          retried: false,
          fallback: false,
          injectionFlagged,
          lowConfidence: validated.data.confidence < CONFIDENCE_FLOOR,
        },
      };
    }

    // Self-correcting retry: append Zod errors
    console.warn("[ai] First parse failed, retrying with error context");
    const zodErrors = JSON.stringify(validated.error.issues);

    const retryResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        systemInstruction: SYSTEM_PROMPT,
      },
      contents: `${userContent}\n\nYour previous output was invalid JSON:\n${rawText}\n\nValidation errors:\n${zodErrors}\n\nPlease correct the JSON and output ONLY the valid JSON object.`,
    });

    const retryText = retryResponse.text ?? "";
    const retryParsed = JSON.parse(retryText);
    const retryValidated = TriageResultSchema.safeParse(retryParsed);

    if (retryValidated.success) {
      return {
        result: retryValidated.data,
        meta: {
          cached: false,
          retried: true,
          fallback: false,
          injectionFlagged,
          lowConfidence: retryValidated.data.confidence < CONFIDENCE_FLOOR,
        },
      };
    }

    // Second failure → fallback
    console.warn("[ai] Retry also failed, using fallback");
    return {
      result: buildFallback(cleanText, (zone as ZoneOrUnknown) ?? undefined),
      meta: { cached: false, retried: true, fallback: true, injectionFlagged },
    };
  } catch (error) {
    console.error("[ai] Gemini call failed:", error);
    return {
      result: buildFallback(cleanText, (zone as ZoneOrUnknown) ?? undefined),
      meta: { cached: false, retried: false, fallback: true, injectionFlagged },
    };
  }
}
