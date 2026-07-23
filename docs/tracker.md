# StadiumPulse — Task Tracker

## S1 — Scaffold
- [x] `create-next-app` scaffold
- [x] Install `zod`, `@google/genai`, `vitest`
- [x] Add `"test": "vitest run"` script
- [x] Replace home page with placeholder
- [x] Create `.env.example`, update `.gitignore`
- [x] Create `docs/tracker.md`
- [x] `npm run dev` confirmed working

## S2 — Deploy NOW
- [ ] Create public GitHub repo `stadiumpulse`
- [ ] Git init + first commit + push
- [ ] Import to Vercel
- [ ] Set `GEMINI_API_KEY` env var on Vercel
- [ ] Confirm live URL

## S3 — Engine + Schema + Tests
- [x] `src/lib/schema.ts` (with sustainability category)
- [x] `src/lib/engine.ts` (with sustainability weight)
- [x] `src/lib/cache.ts`
- [x] `src/lib/ratelimit.ts`
- [x] `src/lib/seed.ts` (14 incidents)
- [x] `src/tests/engine.test.ts` (23 tests)
- [x] `src/tests/schema.test.ts` (24 tests)
- [x] `src/tests/cache.test.ts` (11 tests)
- [x] `src/tests/ratelimit.test.ts` (6 tests)
- [x] Green `vitest` output — 64 tests passing

## S4 — AI Route
- [x] `src/lib/ai.ts` (with sustainability in prompt)
- [x] `src/app/api/triage/route.ts` (with request ID + rate-limit headers)

## S5 — UI
- [x] `src/lib/store.ts`
- [x] `src/components/Navbar.tsx`
- [x] `src/components/ReportForm.tsx`
- [x] `src/components/IncidentQueue.tsx`
- [x] `src/components/ZoneHeatGrid.tsx`
- [x] `src/components/StatusBadge.tsx`
- [x] `src/app/layout.tsx` (enhanced with nav + landmarks)
- [x] `src/app/page.tsx` (intake)
- [x] `src/app/ops/page.tsx` (dashboard)
- [x] `src/app/stats/page.tsx` (analytics)
- [x] Signature moment animation (glow-pulse)
- [x] Loading/empty/error states

## S6 — Harden
- [x] Security headers in `next.config.ts` (including basic CSP)
- [x] Body-size cap in route.ts
- [x] Safe error paths (fallback chain)
- [x] `SECURITY.md`

## S7 — Accessibility Pass
- [x] Skip link
- [x] Labels on all controls
- [x] Keyboard-only full flow (focus rings)
- [x] `aria-live` on ops page
- [x] `prefers-reduced-motion` respected
- [x] Heat grid readable without color (text labels)
- [x] Semantic landmarks (header, main, footer, nav)

## S8 — Evaluator-Readiness
- [x] `LICENSE` (MIT)
- [x] `CONTRIBUTING.md`
- [x] `.github/workflows/ci.yml`
- [x] `docs/ARCHITECTURE.md`
- [x] Full README (mapping table, architecture, demo script, security)
- [x] JSDoc on all exported lib functions
- [x] Zero `any` types
- [x] `npm test` — 64 tests passing
- [x] `npm run lint` — zero errors
- [x] `npm run build` — successful

## S9 — Narrative + Submit
- [ ] LinkedIn post (~150 words)
- [ ] Submit: Challenge 4, repo URL, deployed URL, LinkedIn URL

## S10 — UI/UX and SEO Polish (Current)
- [x] Add `metadataBase` to `layout.tsx` + canonical url support
- [x] Add skeleton loaders for hydrated components in `/stats` and `/ops`
- [x] Improve text colors for WCAG AAA compliance (high ambient brightness)
- [x] Add detected languages breakdown list on `/stats`
- [x] Add hover animations and dynamic glow highlights for simulated incidents
