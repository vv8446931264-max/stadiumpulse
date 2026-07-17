import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  clearRateLimits,
  getRemainingTokens,
} from "../lib/ratelimit";

beforeEach(() => {
  clearRateLimits();
  vi.restoreAllMocks();
});

describe("checkRateLimit", () => {
  it("allows the first 10 requests from an IP", () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9 - i);
      expect(result.limit).toBe(10);
    }
  });

  it("rejects the 11th request from the same IP", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit("192.168.1.2");
    }
    const result = checkRateLimit("192.168.1.2");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different IPs independently", () => {
    // Exhaust IP A
    for (let i = 0; i < 10; i++) {
      checkRateLimit("ip-a");
    }
    // IP B should still have full tokens
    const result = checkRateLimit("ip-b");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("refills tokens after the rate limit window", () => {
    // Exhaust tokens
    for (let i = 0; i < 10; i++) {
      checkRateLimit("ip-refill");
    }
    expect(checkRateLimit("ip-refill").allowed).toBe(false);

    // Fast-forward past the refill interval (1 minute)
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61 * 1000);

    const result = checkRateLimit("ip-refill");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // 10 refilled, 1 consumed
  });
});

describe("getRemainingTokens", () => {
  it("returns 10 for an unknown IP", () => {
    expect(getRemainingTokens("unknown-ip")).toBe(10);
  });

  it("decreases after requests", () => {
    checkRateLimit("counted-ip");
    checkRateLimit("counted-ip");
    expect(getRemainingTokens("counted-ip")).toBe(8);
  });
});
