/**
 * In-memory LRU cache with TTL for triage results.
 *
 * - Max 100 entries (LRU eviction).
 * - TTL: 10 minutes per entry.
 * - Coalescing: concurrent identical requests share one upstream call.
 *
 * This is a module-level singleton. It resets on cold start — acceptable
 * for a prototype; documented in README as a known limitation.
 */

import type { TriageMeta, TriageResult } from "./schema";

/** Cached triage result with expiration timestamp. */
interface CacheEntry {
  result: TriageResult;
  meta: TriageMeta;
  expiresAt: number;
}

/** TTL for cache entries in milliseconds (10 minutes). */
const TTL_MS = 10 * 60 * 1000;

/** Maximum number of entries before LRU eviction. */
const MAX_ENTRIES = 100;

/** The LRU cache store. Insertion order = access order (Map preserves insertion order). */
const cache = new Map<string, CacheEntry>();

/**
 * In-flight request map for coalescing.
 * If two identical requests arrive before the first resolves,
 * the second awaits the same Promise instead of making a duplicate Gemini call.
 */
const inFlight = new Map<string, Promise<{ result: TriageResult; meta: TriageMeta }>>();

/**
 * Build a normalized cache key from the report text and optional zone.
 *
 * @param text - The report text (will be trimmed and lowercased).
 * @param zone - Optional zone context.
 * @returns A stable cache key string.
 */
export function buildCacheKey(text: string, zone?: string): string {
  return `${zone ?? ""}|${text.trim().toLowerCase()}`;
}

/**
 * Get a cached triage result if it exists and hasn't expired.
 * Accessing an entry refreshes its position in the LRU order.
 *
 * @param key - The cache key.
 * @returns The cached entry, or null if not found/expired.
 */
export function getFromCache(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  // Refresh LRU position: delete and re-insert
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

/**
 * Store a triage result in the cache with TTL.
 * Evicts the oldest entry if the cache exceeds MAX_ENTRIES.
 *
 * @param key - The cache key.
 * @param result - The triage result to cache.
 * @param meta - Metadata about the AI call.
 */
export function setInCache(
  key: string,
  result: TriageResult,
  meta: TriageMeta
): void {
  // Evict oldest if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    result,
    meta,
    expiresAt: Date.now() + TTL_MS,
  });
}

/**
 * Get or create a coalesced in-flight request.
 *
 * If an identical request is already being processed, returns the
 * existing Promise. Otherwise, calls the upstream function and
 * registers the Promise for coalescing.
 *
 * @param key - The cache key.
 * @param upstream - Function that performs the actual triage (e.g., Gemini call).
 * @returns The triage result and metadata.
 */
export async function getOrCoalesce(
  key: string,
  upstream: () => Promise<{ result: TriageResult; meta: TriageMeta }>
): Promise<{ result: TriageResult; meta: TriageMeta }> {
  // Check cache first
  const cached = getFromCache(key);
  if (cached) {
    return { result: cached.result, meta: { ...cached.meta, cached: true } };
  }

  // Check in-flight
  const existing = inFlight.get(key);
  if (existing) {
    return existing;
  }

  // Start new upstream call
  const promise = upstream().then((data) => {
    // Cache the result
    setInCache(key, data.result, data.meta);
    // Remove from in-flight
    inFlight.delete(key);
    return data;
  }).catch((err) => {
    inFlight.delete(key);
    throw err;
  });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Clear all cache entries and in-flight requests.
 * Primarily used in tests.
 */
export function clearCache(): void {
  cache.clear();
  inFlight.clear();
}

/**
 * Get the current number of cached entries.
 * Primarily used in tests.
 */
export function getCacheSize(): number {
  return cache.size;
}
