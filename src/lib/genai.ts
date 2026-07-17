import { GoogleGenAI } from "@google/genai";

/**
 * Build a Gemini client from the environment, supporting two backends:
 *
 *   1. **Vertex AI** (`GOOGLE_GENAI_USE_VERTEXAI=true`) — authenticates with
 *      GCP Application Default Credentials, no API key. This is how the
 *      deployed Cloud Run service talks to Gemini: Cloud Run supplies the
 *      runtime service account's credentials automatically.
 *   2. **Gemini Developer API** (`GEMINI_API_KEY`) — for local development
 *      without GCP credentials.
 *
 * Returns `null` when neither is configured, so callers fall back
 * deterministically instead of throwing.
 */
export function getGenAI(): GoogleGenAI | null {
  if (process.env.GOOGLE_GENAI_USE_VERTEXAI === "true") {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION ?? "global";
    if (!project) {
      console.error("[genai] Vertex mode set but GOOGLE_CLOUD_PROJECT is missing");
      return null;
    }
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  return null;
}

/** Which backend is active — for logs and diagnostics. */
export function genaiBackend(): "vertex" | "apikey" | "none" {
  if (
    process.env.GOOGLE_GENAI_USE_VERTEXAI === "true" &&
    process.env.GOOGLE_CLOUD_PROJECT
  ) {
    return "vertex";
  }
  if (process.env.GEMINI_API_KEY) return "apikey";
  return "none";
}
