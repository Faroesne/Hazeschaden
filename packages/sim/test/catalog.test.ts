import { UNITS, type UnitType } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { simulateBattle, type BattleInput } from "../src/index.js";

const kolossVsSniper: BattleInput = {
  seed: 5,
  armies: [[{ typeId: "koloss", picks: 1, level: 1 }], [{ typeId: "scharfschuetze", picks: 1, level: 1 }]],
};

describe("simulateBattle with a custom unit catalog", () => {
  it("uses the given catalog instead of the built-in one", () => {
    // Built-in values: ranged counters tanks, so the sniper wins.
    expect(simulateBattle(kolossVsSniper).winner).toBe(1);

    const buffed: UnitType[] = UNITS.map((u) => (u.id === "koloss" ? { ...u, hp: 20_000 } : u));
    expect(simulateBattle(kolossVsSniper, { units: buffed }).winner).toBe(0);
  });

  it("rejects armies with unit types missing from the catalog", () => {
    const withoutKoloss = UNITS.filter((u) => u.id !== "koloss");
    expect(() => simulateBattle(kolossVsSniper, { units: withoutKoloss })).toThrow(/koloss/);
  });
});
