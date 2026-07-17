# ⚡ StadiumPulse

**GenAI incident triage copilot for FIFA World Cup 2026 venue operations.**

> Fans, volunteers, and staff report problems in ANY language, in their own words; Gemini converts each report into a validated, structured incident; a deterministic engine scores priority and updates a live zone heat map for the ops team.

**🔗 Live URL:** `[YOUR_VERCEL_URL]`
**📂 Repo:** `[YOUR_GITHUB_URL]`

---

## 30-Second Demo

1. Open the live URL → you land on the **Report** page with 14 pre-loaded demo incidents.
2. Click the **"Hindi"** example chip → textarea fills with `"Gate B ke paas bahut bheed hai..."`.
3. Click **"Send report"** → watch the AI triage it in ~2 seconds. A success card shows category, severity, zone, and recommended action.
4. Click **"View in Ops Dashboard →"** → the new incident appears at the top of the priority queue with a cyan glow animation. The zone heat grid updates.
5. Click **"Simulate matchday"** → 5 more incidents flood in. Watch the heat map light up.
6. Navigate to **Analytics** → see category breakdown, zone severity, resolution rate donut chart.

---

## The Challenge

> **PromptWars Virtual — Challenge 4: Smart Stadiums & Tournament Operations**
>
> "Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff. The solution must leverage Generative AI to improve navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support during the FIFA World Cup 2026."

## Problem–Solution Mapping

| Challenge Keyword | StadiumPulse Feature | Where |
|---|---|---|
| **Multilingual assistance** | Any-language report intake, Gemini language detection + English summary | `src/lib/ai.ts`, `/` |
| **Crowd management** | Crowding category, severity rubric, zone heat map | `src/lib/engine.ts`, `/ops` |
| **Operational intelligence** | Structured triage of fuzzy reports into ranked ops queue + analytics | `/api/triage`, `/ops`, `/stats` |
| **Real-time decision support** | Deterministic priority scoring + recommended action + trend analytics | `src/lib/engine.ts`, `/stats` |
| **Accessibility (as a service)** | Accessibility incident category routed at high weight | `src/lib/schema.ts` |
| **Accessibility (of the app)** | WCAG-minded UI: labels, keyboard, contrast, aria-live, reduced motion | All components |
| **Sustainability** | Sustainability incident category for waste/water/energy issues | `src/lib/schema.ts` |
| **Navigation** | Zone-based heat map guides ops team to problem areas | `/ops` |
| **Transportation** | Transport incident category with priority scoring | `src/lib/schema.ts` |

**Coverage: 9/9 challenge keywords.**

---

## Architecture

```
Browser (Fan/Staff)          Next.js API              Google Gemini 2.5 Flash
       │                         │                           │
       │  POST /api/triage       │   structured JSON         │
       │  { text, zone? }  ────► │  ──────────────────────► │
       │                         │                           │
       │                         │  ◄──────────────────────  │
       │  200 { result, meta }   │   Zod-validated result    │
       │  ◄───────────────────── │                           │
       │                         │                           │
       ▼                         ▼                           │
   localStorage            Rate Limiter                      │
   (Zod-validated,         Cache + Coalescing                │
    200 cap)               Security Headers                  │
```

### "AI parses, code calculates" — The Trust Boundary

The LLM **never does arithmetic**. The code **never does NLP**.

- **Gemini's job:** Parse unstructured text in any language → extract `category`, `severity`, `zone`, `summary_en`, `detected_language`, `recommended_action`, `confidence` as JSON.
- **TypeScript's job:** Validate with Zod → compute `priority = clamp(severity × 15 + categoryWeight + zoneBonus, 0, 100)` → compute zone heat → sort queue → render UI.
- **The firewall:** `TriageResultSchema.strict()` — if Gemini returns invalid JSON, we retry once with the Zod error messages, then fall back to a deterministic safe result.

This means: a hallucinated severity or a missing field **never** reaches the dashboard. The worst case is a clearly-labeled fallback routed to human dispatch.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

---

## Run Locally in 60 Seconds

```bash
git clone https://github.com/YOUR_USERNAME/stadiumpulse.git
cd stadiumpulse
npm ci
cp .env.example .env.local
# Edit .env.local → set GEMINI_API_KEY=your_key_from_aistudio.google.com
npm run dev
# Open http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Run 64 tests (vitest) |
| `npm run lint` | ESLint check |

---

## Security Posture

| Protection | Implementation |
|-----------|---------------|
| API key isolation | Server-only `GEMINI_API_KEY` via `.env.local`, never in client code |
| Input validation | Zod schemas on all boundaries; body size capped at 2 KB |
| Rate limiting | Token bucket: 10 req/min/IP (per-instance; resets on cold start) |
| Security headers | `X-Frame-Options: DENY`, `HSTS`, `nosniff`, `Permissions-Policy`, basic CSP |
| Request tracing | `X-Request-Id` UUID on every API response |
| AI output validation | Zod strict validation + self-correcting retry + deterministic fallback |
| XSS prevention | No `dangerouslySetInnerHTML` — all AI text renders as React text nodes |

**Known limitations (honest):**
- Per-instance rate limiter resets on serverless cold start. Production would use Redis.
- CSP is permissive (`unsafe-eval`, `unsafe-inline`) due to Next.js hydration requirements.
- No authentication — ops dashboard is publicly accessible. Production would add auth.
- LocalStorage persistence — no server database. Data is per-browser, capped at 200 incidents.

See [SECURITY.md](SECURITY.md) for full security policy.

---

## Testing

**64 tests across 4 test suites:**

| Suite | Tests | Covers |
|-------|-------|--------|
| `engine.test.ts` | 23 | Priority per category, clamp bounds, zone bonus at exactly 3, heat thresholds (0/1/4/5/9/10), zone heat computation, zone counting |
| `schema.test.ts` | 24 | Valid/invalid TriageResult, severity 0/6 rejected, NaN confidence, unknown zone, strict mode (extra fields rejected), Incident schema, Request schema, sustainability category |
| `cache.test.ts` | 11 | Hit/miss, TTL expiry, LRU eviction at 100, request coalescing, key normalization |
| `ratelimit.test.ts` | 6 | 10 allowed / 11th rejected, independent IPs, token refill after window |

```bash
npm test
```

---

## Accessibility Audit

| Check | Status |
|-------|--------|
| Skip-to-main link | ✅ Hidden, visible on focus |
| Semantic landmarks | ✅ `<header>`, `<main>`, `<footer>`, `<nav>` |
| All controls labeled | ✅ `<label>`, `aria-label` on all buttons/inputs |
| Keyboard-only navigation | ✅ Tab order, visible focus rings |
| AA contrast ratios | ✅ Light text on dark backgrounds (checked) |
| `aria-live` announcements | ✅ New incidents announced on `/ops` |
| `prefers-reduced-motion` | ✅ All animations disabled |
| Heat grid without color | ✅ Heat level shown as text word (calm/busy/high/critical) |
| Form validation feedback | ✅ `role="alert"` for errors, `role="status"` for success |

---

## Efficiency

- **Cache:** LRU cache (100 entries, 10-min TTL) prevents duplicate Gemini calls.
- **Request coalescing:** Concurrent identical requests share one upstream Gemini call.
- **Zero heavy deps:** No chart libs (CSS grid heat map, SVG donut), no state libs, no DB drivers.
- **Static prerendering:** All pages except `/api/triage` are statically generated at build time.
- **Tailwind:** Utility CSS, tree-shaken in production — minimal CSS payload.

---

## Known Limitations & Next Steps

| Current | Production Evolution |
|---------|---------------------|
| localStorage (200 cap) | PostgreSQL / Firestore with real-time subscriptions |
| Per-instance rate limiter | Redis / Cloudflare rate limiting |
| No authentication | Firebase Auth with role-based access (fan/volunteer/staff) |
| Permissive CSP | Nonce-based CSP with strict dynamic |
| Polling for updates | WebSocket / Server-Sent Events for live push |
| Single venue | Multi-venue support with venue selector |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Validation | Zod 4 |
| Testing | Vitest 4 |
| Deploy | Vercel |

---

*Built with **Google Antigravity** + **Gemini** for PromptWars Challenge 4 — Smart Stadiums & Tournament Operations.*
