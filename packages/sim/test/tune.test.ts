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

  it("judges goals exactly like checkGoals, including majority-only conflict goals", () => {
    // Mortar (area) vs. Koloss (elite) is a role-vs-form conflict.
    const withConflict: UnitType[] = [getUnitType("koloss"), getUnitType("moerser"), getUnitType("klingenmeister")];
    const { units, report } = tuneUnits(withConflict, { seeds: 4, maxPasses: 4 });

    const key = (c: { kind: string; expectedWinner: string; opponent: string }) =>
      `${c.kind} ${c.expectedWinner}>${c.opponent}`;
    const expected = checkGoals(4, { units }).filter((c) => !c.passed).map(key);
    expect(report.failures.map(key)).toEqual(expected);
    expect(report.passed).toBe(expected.length === 0);
  });

  it("leaves a catalog alone when a conflict goal already has its majority", () => {
    // Found by search: mortar wins 6/8 against Koloss (conflict goal, 60% needed); all else passes.
    // Re-search when battle rules change (see git history of this test for the search loop).
    const almost: UnitType[] = [
      getUnitType("koloss"),
      { ...getUnitType("moerser"), hp: 275, damage: 350 },
      getUnitType("klingenmeister"),
    ];
    expect(checkGoals(4, { units: almost }).every((c) => c.passed)).toBe(true);

    const { units, report } = tuneUnits(almost, { seeds: 4 });

    expect(report.passed).toBe(true);
    expect(units).toEqual(almost);
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
