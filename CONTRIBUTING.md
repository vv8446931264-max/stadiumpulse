# Contributing to StadiumPulse

Thank you for your interest in contributing to StadiumPulse!

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stadiumpulse.git
   cd stadiumpulse
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Code Style

- **TypeScript strict mode** — no `any` types anywhere.
- **Zod validation** on all boundaries (API input, localStorage read, AI output).
- **JSDoc** on all exported functions.
- **< 200 lines** per file.
- **Pure functions** in `engine.ts` — no side effects, no imports from `app/` or `ai.ts`.

## Architecture Principle

**"AI parses, code calculates."**

- Gemini extracts structured data from unstructured text.
- All arithmetic (priority scoring, zone heat) is deterministic TypeScript.
- The LLM never does math. The code never does NLP.

## Testing

Run the test suite with:
```bash
npm test
```

All new logic in `src/lib/` should have corresponding tests in `src/tests/`.

## Pull Request Process

1. Ensure `npm test` and `npm run build` pass.
2. Update documentation if you changed any public API.
3. Keep commits small and descriptive.
