/**
 * Token-bucket rate limiter per IP address.
 *
 * - 10 requests per minute per IP.
 * - Module-level Map — resets on cold start.
 *
 * // per-instance limiter; resets on cold start — acceptable for prototype, note in README
 */

/** Maximum tokens (requests) per bucket. */
const MAX_TOKENS = 10;

/** Token refill interval in milliseconds (1 minute). */
const REFILL_INTERVAL_MS = 60 * 1000;

/** A single token bucket for one IP address. */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/** Rate limiter state: one bucket per IP. */
const buckets = new Map<string, TokenBucket>();

/**
 * Refill tokens based on elapsed time since last refill.
 * Uses a simple approach: if enough time has passed, fully refill.
 *
 * @param bucket - The token bucket to refill.
 * @param now - Current timestamp in ms.
 */
function refill(bucket: TokenBucket, now: number): void {
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= REFILL_INTERVAL_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }
}

/**
 * Check if a request from the given IP is allowed.
 *
 * Returns an object with:
 * - `allowed`: whether the request should proceed.
 * - `remaining`: how many tokens are left after this request.
 * - `limit`: the maximum tokens per window.
 *
 * @param ip - The client IP address.
 * @returns Rate limit check result.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(ip, bucket);
  }

  refill(bucket, now);

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return { allowed: true, remaining: bucket.tokens, limit: MAX_TOKENS };
  }

  return { allowed: false, remaining: 0, limit: MAX_TOKENS };
}

/**
 * Clear all rate limiter state.
 * Primarily used in tests.
 */
export function clearRateLimits(): void {
  buckets.clear();
}

/**
 * Get the current remaining tokens for a given IP.
 * Returns MAX_TOKENS if no bucket exists yet.
 * Primarily used in tests.
 *
 * @param ip - The client IP address.
 * @returns Number of remaining tokens.
 */
export function getRemainingTokens(ip: string): number {
  const bucket = buckets.get(ip);
  if (!bucket) return MAX_TOKENS;
  refill(bucket, Date.now());
  return bucket.tokens;
}
