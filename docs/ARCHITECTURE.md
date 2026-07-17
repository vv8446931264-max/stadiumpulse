# StadiumPulse — Architecture

## System Context

```
┌─────────────┐     HTTP POST      ┌─────────────────────┐    Gemini API     ┌──────────────┐
│   Browser    │ ─────────────────► │  Next.js API Route  │ ───────────────► │  Google       │
│  (Fan/Staff) │ ◄───────────────── │  /api/triage        │ ◄─────────────── │  Gemini 2.5   │
│              │     JSON Response  │                     │    Structured    │  Flash        │
└──────┬───────┘                    └──────────┬──────────┘    JSON           └──────────────┘
       │                                       │
       │ localStorage                          │ Server-only
       │ (Zod-validated)                       │ modules
       ▼                                       ▼
┌─────────────┐                    ┌─────────────────────┐
│  Client      │                    │  src/lib/           │
│  Store       │                    │  ├─ ai.ts           │
│  (200 cap)   │                    │  ├─ cache.ts        │
└─────────────┘                    │  ├─ ratelimit.ts    │
                                   │  ├─ engine.ts       │
                                   │  └─ schema.ts       │
                                   └─────────────────────┘
```

## Data Flow: Report → Triage → Dashboard

```
1. USER writes report    ──►  ReportForm.tsx
   (any language)              │
                               ▼
2. POST /api/triage      ──►  route.ts
   { text, zone? }             │
                               ├─ Validate body (Zod)
                               ├─ Check rate limit (ratelimit.ts)
                               ├─ Check cache (cache.ts)
                               │    └─ Coalesce concurrent identical requests
                               ▼
3. Gemini call           ──►  ai.ts
   (system prompt +            │
    user text)                 ├─ JSON.parse response
                               ├─ Zod validate (TriageResultSchema)
                               ├─ On failure: retry with Zod errors
                               ├─ On 2nd failure: deterministic fallback
                               ▼
4. Response              ──►  { ok: true, result: TriageResult, meta }
                               │
                               ▼
5. Client store          ──►  store.ts
   │                           │
   ├─ computePriority()        ├─ engine.ts (pure functions)
   ├─ addIncident()            ├─ localStorage write
   ▼                           ▼
6. Dashboard updates     ──►  ops/page.tsx
   │                           │
   ├─ IncidentQueue           ├─ Sorted by priority desc
   ├─ ZoneHeatGrid            ├─ Heat: sum(severity) per zone
   └─ aria-live announce      └─ "New {category} incident..."
```

## AI Trust Boundary

```
┌─────────────────────────────────────────────────────────┐
│                    TRUST BOUNDARY                        │
│                                                          │
│  ┌──────────────────┐    ┌────────────────────────────┐ │
│  │  AI Domain        │    │  Code Domain               │ │
│  │  (Gemini)         │    │  (TypeScript)               │ │
│  │                   │    │                             │ │
│  │  • Parse language │    │  • Priority arithmetic      │ │
│  │  • Extract fields │    │  • Zone heat calculation    │ │
│  │  • Classify       │    │  • Input validation         │ │
│  │  • Summarize      │    │  • Rate limiting            │ │
│  │                   │    │  • Caching                  │ │
│  │  OUTPUT: JSON     │    │  • Data persistence         │ │
│  │  (Zod-validated)  │    │  • UI rendering             │ │
│  └──────────────────┘    └────────────────────────────┘ │
│                                                          │
│  The LLM NEVER does arithmetic.                          │
│  The code NEVER does NLP.                                │
│  Zod validation is the firewall between the two.         │
└─────────────────────────────────────────────────────────┘
```

## Self-Correcting AI Pipeline

```
User Report
    │
    ▼
Gemini Call #1
    │
    ├─ JSON.parse OK? ──► Zod validate
    │                         │
    │                    ┌────┴────┐
    │                    │ Valid?  │
    │                    └────┬───┘
    │                     Yes │  No
    │                      │    │
    │                      ▼    ▼
    │                   Return  Retry with Zod
    │                   result  error messages
    │                              │
    │                              ▼
    │                         Gemini Call #2
    │                              │
    │                         ┌────┴────┐
    │                         │ Valid?  │
    │                         └────┬───┘
    │                          Yes │  No
    │                           │    │
    │                           ▼    ▼
    │                        Return  FALLBACK
    │                        result  (deterministic)
    │
    ├─ JSON.parse FAIL? ──► FALLBACK
    │
    └─ Network error? ───► FALLBACK
```

**Fallback guarantees:** Every report gets a 200 response. The fallback uses
`category: "other"`, `severity: 3`, `confidence: 0`, and routes to human dispatch.
Meta includes `fallback: true` so the UI can display a warning.

## Security Model

| Layer | Protection |
|-------|-----------|
| Network | HTTPS (Vercel), HSTS, security headers |
| API Gateway | Body size cap (2 KB), rate limiting (10/min/IP) |
| Input | Zod schema validation, trim/length checks |
| AI Output | Zod strict validation, self-correcting retry, deterministic fallback |
| Client | No `dangerouslySetInnerHTML`, Zod-validated localStorage reads |
| Secrets | Server-only env vars, `.env.local` gitignored, `.env.example` committed |

## Dependency Philosophy

**Zero heavy dependencies.** The entire runtime is:
- `next` — framework
- `react` / `react-dom` — UI
- `zod` — validation
- `@google/genai` — Gemini client

No chart libraries (heat map is CSS grid), no state management libraries
(React state + localStorage), no database (localStorage with Zod validation),
no UI component kits (Tailwind utilities).
