import { NextRequest, NextResponse } from "next/server";
import { TriageRequestSchema } from "@/lib/schema";
import type { TriageMeta, TriageResult } from "@/lib/schema";
import { triageWithGemini } from "@/lib/ai";
import { buildCacheKey, getOrCoalesce } from "@/lib/cache";
import { checkRateLimit } from "@/lib/ratelimit";

/** Maximum request body size in bytes (2 KB). */
const MAX_BODY_SIZE = 2048;

/**
 * POST /api/triage
 *
 * Accepts a free-text incident report (any language) and optional zone,
 * returns a structured triage result.
 *
 * Flow: validate → rate-limit → cache/coalesce → Gemini → Zod validate → respond.
 * Fallback always returns 200 with meta.fallback: true — never a 500 to the user.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  try {
    // --- Body size check ---
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Request body too large. Maximum 2 KB." },
        {
          status: 400,
          headers: { "X-Request-Id": requestId },
        }
      );
    }

    // --- Parse and validate body ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        {
          status: 400,
          headers: { "X-Request-Id": requestId },
        }
      );
    }

    const parseResult = TriageRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid report. Text must be 1-500 characters." },
        {
          status: 400,
          headers: { "X-Request-Id": requestId },
        }
      );
    }

    const { text, zone } = parseResult.data;
    const trimmedText = text.trim();

    // Double-check after trim
    if (trimmedText.length < 1 || trimmedText.length > 500) {
      return NextResponse.json(
        { ok: false, error: "Invalid report. Text must be 1-500 characters." },
        {
          status: 400,
          headers: { "X-Request-Id": requestId },
        }
      );
    }

    // --- Rate limit ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      console.warn(`[api/triage] Rate limited IP: ${ip}`);
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

    // --- Triage (with cache + coalescing) ---
    const cacheKey = buildCacheKey(trimmedText, zone);

    const { result, meta } = await getOrCoalesce(cacheKey, () =>
      triageWithGemini(trimmedText, zone)
    );

    return NextResponse.json(
      {
        ok: true,
        result,
        meta,
      } satisfies { ok: true; result: TriageResult; meta: TriageMeta },
      {
        status: 200,
        headers: {
          "X-Request-Id": requestId,
          "X-RateLimit-Limit": String(rateCheck.limit),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      }
    );
  } catch (error) {
    // This should never happen due to fallback in triageWithGemini,
    // but defense-in-depth: never leak internals.
    console.error("[api/triage] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      {
        status: 500,
        headers: { "X-Request-Id": requestId },
      }
    );
  }
}
