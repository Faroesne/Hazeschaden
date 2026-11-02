import { UNITS, type UnitType } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { checkGoals } from "../src/index.js";

describe("checkGoals", () => {
  it("covers every counter pair once per goal kind (16 pairs × 3 role pairs × 3 kinds)", () => {
    const checks = checkGoals(1);
    expect(checks).toHaveLength(144);
    expect(checks.filter((c) => c.kind === "1v1")).toHaveLength(48);
  });

  it("only asks for a majority when the form works against the expected winner", () => {
    const checks = checkGoals(1);
    const find = (kind: string, winner: string, opponent: string) =>
      checks.find((c) => c.kind === kind && c.expectedWinner === winner && c.opponent === opponent)!;

    // Mortar (area) vs. Koloss (elite): elite counters area → conflict.
    expect(find("1v1", "moerser", "koloss").requiredWinPct).toBe(60);
    // Sniper (single) vs. shield bearers (mass): mass counters single target → conflict.
    expect(find("1v1", "scharfschuetze", "schildtraeger").requiredWinPct).toBe(60);
    // Blade master (single) vs. sniper (elite): no form advantage for the sniper → always.
    expect(find("1v1", "klingenmeister", "scharfschuetze").requiredWinPct).toBe(100);
    // 2v1: archers (mass) vs. blade master (single) → form helps the expected winner → always.
    expect(find("2v1", "bogenschuetzen", "klingenmeister").requiredWinPct).toBe(100);
  });

  it("passes more 1v1 goals when the counter bonus is overwhelming", () => {
    const failed1v1 = (counterBonusPct: number): number =>
      checkGoals(2, { balance: { counterBonusPct } }).filter((c) => c.kind === "1v1" && !c.passed).length;
    // Not all: a mortar still wipes clumped mass assassins in one shot (area beats mass).
    expect(failed1v1(5000)).toBeLessThan(failed1v1(0));
    expect(failed1v1(5000)).toBeLessThanOrEqual(2);
  });

  it("judges the catalog it is given", () => {
    const harmlessAssassins: UnitType[] = UNITS.map((u) => (u.role === "assassin" ? { ...u, hp: 1, damage: 0 } : u));
    const assassin1v1 = checkGoals(2, { units: harmlessAssassins }).filter(
      (c) => c.kind === "1v1" && harmlessAssassins.find((u) => u.id === c.expectedWinner)?.role === "assassin",
    );
    expect(assassin1v1).toHaveLength(16);
    expect(assassin1v1.every((c) => !c.passed)).toBe(true);
  });
});
