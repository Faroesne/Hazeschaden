import { getUnitType, type UnitType } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { checkGoals, tuneUnits } from "../src/index.js";

/** One unit per role; the tank is far too fragile to counter the assassin. */
const unbalanced: UnitType[] = [
  { ...getUnitType("koloss"), hp: 400 },
  getUnitType("scharfschuetze"),
  getUnitType("klingenmeister"),
];

const failures = (units: readonly UnitType[]): number =>
  checkGoals(4, { units }).filter((c) => !c.passed).length;

describe("tuneUnits", () => {
  it("tunes a small unbalanced catalog until every goal passes", () => {
    expect(failures(unbalanced)).toBeGreaterThan(0);

    const { units, report } = tuneUnits(unbalanced, { seeds: 4 });

    expect(report.passed).toBe(true);
    expect(report.failures).toEqual([]);
    expect(failures(units)).toBe(0);
    expect(units.map((u) => u.id)).toEqual(unbalanced.map((u) => u.id));
  });

  it("is deterministic", () => {
    const a = tuneUnits(unbalanced, { seeds: 2 });
    const b = tuneUnits(unbalanced, { seeds: 2 });
    expect(a).toEqual(b);
  });

  it("keeps values within the bounds of the reference catalog", () => {
    // Start from an already-doubled tank; bounds come from the original values.
    const start: UnitType[] = unbalanced.map((u) => ({ ...u, hp: u.hp * 2 }));
    const { units } = tuneUnits(start, { seeds: 2, reference: unbalanced, minFactorPct: 50, maxFactorPct: 200 });
    units.forEach((u, i) => {
      const ref = unbalanced[i]!;
      expect(u.hp).toBeGreaterThanOrEqual(Math.floor(ref.hp / 2));
      expect(u.hp).toBeLessThanOrEqual(ref.hp * 2);
      expect(u.damage).toBeGreaterThanOrEqual(Math.floor(ref.damage / 2));
      expect(u.damage).toBeLessThanOrEqual(ref.damage * 2);
    });
  });

  it("reports failure honestly when the goals cannot be reached", () => {
    // A tank that deals no damage can never win, whatever its HP.
    const hopeless: UnitType[] = [{ ...getUnitType("koloss"), damage: 0 }, unbalanced[1]!, unbalanced[2]!];

    const { report } = tuneUnits(hopeless, { seeds: 2, maxPasses: 3 });

    expect(report.passed).toBe(false);
    expect(report.failures.length).toBeGreaterThan(0);
    expect(report.failures.some((f) => f.expectedWinner === "koloss")).toBe(true);
  });
});
