# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in StadiumPulse, please report it responsibly by emailing the maintainer directly. Do not open a public issue.

## Security Posture

StadiumPulse implements the following security measures:

### Server-Side

- **API key isolation**: `GEMINI_API_KEY` is server-only via `.env.local`, never referenced in client components, and gitignored.
- **Input validation**: All inputs are validated with Zod schemas before processing. Request body size is capped at 2 KB.
- **Rate limiting**: Token-bucket rate limiter (10 req/min per IP) prevents API abuse. Per-instance; resets on cold start — acceptable for prototype.
- **Safe error messages**: Error responses never leak internal state, stack traces, or API details.
- **Security headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` (camera/geolocation denied; microphone same-origin only, for voice reporting), and a Content Security Policy.
- **Request tracing**: Every API response includes an `X-Request-Id` header (UUID) for incident correlation.

### Client-Side

- **No `dangerouslySetInnerHTML` on dynamic data**: All AI-generated and user text renders as React text nodes only. The single use of `dangerouslySetInnerHTML` is a static, compile-time JSON-LD object in the root layout — no user input flows into it.
- **LocalStorage validation**: Data is Zod-validated on every read. Invalid data triggers an automatic reset to seed data.
- **No third-party scripts**: Zero external runtime dependencies beyond Next.js and Gemini API.

### Known Limitations (Honest Assessment)

| Limitation | Rationale |
|---|---|
| **Per-instance rate limiter** | Module-level `Map` resets on serverless cold start. Production would use Redis or Cloudflare rate limiting. |
| **Permissive CSP** | Next.js requires `unsafe-eval` and `unsafe-inline` for client-side hydration. A nonce-based CSP is a stretch goal. |
| **No authentication** | Prototype scope — ops dashboard is publicly accessible. Production would add Firebase Auth or similar. |
| **LocalStorage persistence** | No server-side database. Data is per-browser and capped at 200 incidents. |

## Supported Versions

This is a hackathon prototype. Only the latest commit on `main` is supported.
