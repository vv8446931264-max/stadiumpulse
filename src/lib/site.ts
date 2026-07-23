/** Canonical public URL. Cloud Run is the primary; Vercel is a backup mirror. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://stadiumpulse-580541627338.us-central1.run.app";
