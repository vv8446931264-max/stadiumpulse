import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildCacheKey,
  getFromCache,
  setInCache,
  getOrCoalesce,
  clearCache,
  getCacheSize,
} from "../lib/cache";
import type { TriageMeta, TriageResult } from "../lib/schema";

/** Helper: create a minimal valid TriageResult for tests. */
function makeResult(overrides: Partial<TriageResult> = {}): TriageResult {
  return {
    category: "other",
    severity: 3,
    zone: "unknown",
    summary_en: "Test summary for caching.",
    detected_language: "English",
    recommended_action: "Test action.",
    confidence: 0.8,
    ...overrides,
  };
}

const baseMeta: TriageMeta = { cached: false, retried: false, fallback: false };

beforeEach(() => {
  clearCache();
  vi.restoreAllMocks();
});

describe("buildCacheKey", () => {
  it("normalizes text to lowercase and trims", () => {
    expect(buildCacheKey("  Hello World  ")).toBe("|hello world");
  });

  it("includes zone in key when provided", () => {
    expect(buildCacheKey("test", "north_gate")).toBe("north_gate|test");
  });

  it("uses empty string for zone when not provided", () => {
    expect(buildCacheKey("test")).toBe("|test");
  });
});

describe("getFromCache / setInCache", () => {
  it("returns null for a cache miss", () => {
    expect(getFromCache("nonexistent")).toBeNull();
  });

  it("returns cached entry on hit", () => {
    const result = makeResult();
    setInCache("key1", result, baseMeta);
    const entry = getFromCache("key1");
    expect(entry).not.toBeNull();
    expect(entry!.result.category).toBe("other");
  });

  it("returns null after TTL expires", () => {
    const result = makeResult();
    setInCache("ttl-key", result, baseMeta);

    // Fast-forward time past TTL (10 minutes)
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11 * 60 * 1000);

    expect(getFromCache("ttl-key")).toBeNull();
  });

  it("evicts oldest entry when exceeding MAX_ENTRIES (100)", () => {
    // Fill cache to capacity
    for (let i = 0; i < 100; i++) {
      setInCache(`key-${i}`, makeResult(), baseMeta);
    }
    expect(getCacheSize()).toBe(100);

    // Add one more — should evict key-0
    setInCache("key-100", makeResult(), baseMeta);
    expect(getCacheSize()).toBe(100);
    expect(getFromCache("key-0")).toBeNull(); // evicted
    expect(getFromCache("key-100")).not.toBeNull(); // present
  });
});

describe("getOrCoalesce", () => {
  it("calls upstream on cache miss", async () => {
    const upstream = vi.fn().mockResolvedValue({
      result: makeResult({ category: "medical" }),
      meta: baseMeta,
    });

    const { result } = await getOrCoalesce("coal-key", upstream);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(result.category).toBe("medical");
  });

  it("returns cached result without calling upstream on cache hit", async () => {
    setInCache("cached-key", makeResult({ category: "security" }), baseMeta);

    const upstream = vi.fn();
    const { result, meta } = await getOrCoalesce("cached-key", upstream);
    expect(upstream).not.toHaveBeenCalled();
    expect(result.category).toBe("security");
    expect(meta.cached).toBe(true);
  });

  it("coalesces concurrent identical requests into one upstream call", async () => {
    let resolveUpstream: (value: { result: TriageResult; meta: TriageMeta }) => void;
    const upstreamPromise = new Promise<{ result: TriageResult; meta: TriageMeta }>(
      (resolve) => {
        resolveUpstream = resolve;
      }
    );
    const upstream = vi.fn().mockReturnValue(upstreamPromise);

    // Fire two concurrent requests with the same key
    const p1 = getOrCoalesce("dup-key", upstream);
    const p2 = getOrCoalesce("dup-key", upstream);

    // Upstream should only be called once
    expect(upstream).toHaveBeenCalledTimes(1);

    // Resolve the upstream
    resolveUpstream!({ result: makeResult({ category: "crowding" }), meta: baseMeta });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.result.category).toBe("crowding");
    expect(r2.result.category).toBe("crowding");
  });

  it("different keys trigger separate upstream calls", async () => {
    const upstream = vi.fn().mockResolvedValue({
      result: makeResult(),
      meta: baseMeta,
    });

    await getOrCoalesce("key-a", upstream);
    await getOrCoalesce("key-b", upstream);
    expect(upstream).toHaveBeenCalledTimes(2);
  });
});
