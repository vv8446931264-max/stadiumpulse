import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  AssistRequestSchema,
  AssistResultSchema,
  ZONES,
  ZONE_LABELS,
} from "@/lib/schema";
import type { AssistResult } from "@/lib/schema";
import { checkRateLimit } from "@/lib/ratelimit";

/** Maximum request body size in bytes (2 KB) — same cap as /api/triage. */
const MAX_BODY_SIZE = 2048;

/**
 * Gemini system prompt for the fan navigation assistant.
 * Same trust boundary as triage: the model outputs strict JSON only,
 * validated by Zod before it reaches any client.
 */
const ASSIST_PROMPT = `You are StadiumPulse's fan assistant for a FIFA World Cup 2026 stadium.
The stadium zones are: ${ZONES.map((z) => ZONE_LABELS[z]).join(", ")}.
Layout facts: gates are at the north and south; stands are east and west; the concourse ring connects everything; the fan zone, transit hub, and parking are outside the bowl. Accessible entrances exist at every gate; medical posts are at each gate and on the concourse; water refill points are on the concourse.
Answer the fan's question in THE SAME LANGUAGE the fan used, in at most 2 short sentences. Be concrete about direction and zone. Never give medical advice — direct medical questions to the nearest medical post.
Output ONLY a JSON object: {"answer": string, "detected_language": string}.`;

/** Safe deterministic fallback — the fan always gets an actionable answer. */
const FALLBACK: AssistResult = {
  answer: "Please ask a steward at the nearest gate — they can direct you.",
  detected_language: "und",
};

/**
 * POST /api/assist
 *
 * Fan navigation Q&A in any language. Second GenAI use case alongside triage.
 * Flow: validate → rate-limit → Gemini → Zod validate → respond.
 * Any failure returns 200 with meta.fallback: true — never a 500 to the fan.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    // --- Body size check ---
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Request body too large. Maximum 2 KB." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    // --- Parse and validate body ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    const parseResult = AssistRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid question. Must be 1-300 characters." },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    const { question, zone } = parseResult.data;

    // --- Rate limit (shared limiter with /api/triage) ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.warn(`[api/assist] Rate limited IP: ${ip}`);
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a moment." },
        {
          status: 429,
          headers: {
            "X-Request-Id": requestId,
            "X-RateLimit-Limit": String(rateCheck.limit),
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
          },
        }
      );
    }

    // --- Ask Gemini (deterministic fallback on any failure) ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[api/assist] GEMINI_API_KEY is not set");
      return NextResponse.json(
        { ok: true, result: FALLBACK, meta: { fallback: true } },
        { status: 200, headers: { "X-Request-Id": requestId } }
      );
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          systemInstruction: ASSIST_PROMPT,
        },
        contents: zone
          ? `${question}\n\nFan's current zone: ${ZONE_LABELS[zone]}`
          : question,
      });

      const validated = AssistResultSchema.safeParse(
        JSON.parse(response.text ?? "")
      );

      if (validated.success) {
        return NextResponse.json(
          { ok: true, result: validated.data, meta: { fallback: false } },
          { status: 200, headers: { "X-Request-Id": requestId } }
        );
      }

      console.warn("[api/assist] Gemini output failed validation, falling back");
    } catch (error) {
      console.error("[api/assist] Gemini call failed:", error);
    }

    return NextResponse.json(
      { ok: true, result: FALLBACK, meta: { fallback: true } },
      { status: 200, headers: { "X-Request-Id": requestId } }
    );
  } catch (error) {
    // Defense-in-depth: never leak internals.
    console.error("[api/assist] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500, headers: { "X-Request-Id": requestId } }
    );
  }
}
