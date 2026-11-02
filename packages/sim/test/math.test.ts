import { describe, expect, it } from "vitest";
import { isqrt, withPct } from "../src/math.js";
import { Rng } from "../src/rng.js";

describe("isqrt", () => {
  it("is exact floor(sqrt(n))", () => {
    for (let n = 0; n < 5000; n++) {
      const r = isqrt(n);
      expect(r * r).toBeLessThanOrEqual(n);
      expect((r + 1) * (r + 1)).toBeGreaterThan(n);
    }
    expect(isqrt(2_000_000_000)).toBe(44721);
  });
});

describe("withPct", () => {
  it("applies a percent bonus with truncation", () => {
    expect(withPct(200, 40)).toBe(280);
    expect(withPct(33, 50)).toBe(49);
  });
});

describe("Rng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = new Rng(123);
    const b = new Rng(123);
    for (let i = 0; i < 100; i++) expect(a.nextU32()).toBe(b.nextU32());
  });

  it("stays within bounds", () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});
