/** Integer helpers. The simulation never stores fractional values. */

/** Integer division, truncated toward zero. */
export function idiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

/** Exact floor(sqrt(n)) for non-negative integers, independent of the engine's Math.sqrt. */
export function isqrt(n: number): number {
  if (n <= 0) return 0;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Applies a percent bonus with integer math. */
export function withPct(value: number, pct: number): number {
  return idiv(value * (100 + pct), 100);
}
