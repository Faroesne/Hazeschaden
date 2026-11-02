import { COUNTERS, UNITS, pickBudget } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";

describe("unit catalog", () => {
  it("has 12 units, 4 per role, one per form × damage kind", () => {
    expect(UNITS).toHaveLength(12);
    for (const role of ["tank", "ranged", "assassin"] as const) {
      const mine = UNITS.filter((u) => u.role === role);
      expect(mine).toHaveLength(4);
      const combos = new Set(mine.map((u) => `${u.form}/${u.damageKind}`));
      expect(combos.size).toBe(4);
    }
  });

  it("has unique ids and integer values", () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
    for (const u of UNITS) {
      for (const v of [u.count, u.hp, u.damage, u.attackIntervalTicks, u.range, u.speed, u.radius, u.areaRadius]) {
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });

  it("counters form a rock-paper-scissors cycle", () => {
    expect(COUNTERS.assassin).toBe("ranged");
    expect(COUNTERS.ranged).toBe("tank");
    expect(COUNTERS.tank).toBe("assassin");
  });

  it("keeps every pick near the Lanchester budget (area units ~30% lower)", () => {
    for (const u of UNITS) {
      const target = u.damageKind === "area" ? 35_000 : 50_000;
      const budget = pickBudget(u);
      expect(budget / target).toBeGreaterThan(0.8);
      expect(budget / target).toBeLessThan(1.2);
    }
  });
});
