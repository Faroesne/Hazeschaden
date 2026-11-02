import { BATTLE, UNITS } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { simulateBattle, type ArmyEntry, type BattleInput } from "../src/index.js";

const one = (typeId: string, picks = 1, level = 1): ArmyEntry => ({ typeId, picks, level });

/** FNV-1a over the JSON of a value; used for golden tests. */
function hash(value: unknown): string {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const mixed: BattleInput = {
  seed: 42,
  armies: [
    [one("koloss"), one("bogenschuetzen", 2), one("klingenmeister"), one("moerser", 1, 2)],
    [one("schildtraeger", 2), one("scharfschuetze"), one("schattenrudel"), one("dornenwache")],
  ],
};

describe("determinism", () => {
  it("gives identical results and logs for identical input", () => {
    const a = simulateBattle(mixed, { record: true });
    const b = simulateBattle(mixed, { record: true });
    expect(a).toEqual(b);
  });

  it("does not depend on whether the log is recorded", () => {
    const withLog = simulateBattle(mixed, { record: true });
    const without = simulateBattle(mixed);
    expect(without.winner).toBe(withLog.winner);
    expect(without.ticks).toBe(withLog.ticks);
    expect(without.remainingHp).toEqual(withLog.remainingHp);
  });

  it("does not depend on the order of army entries", () => {
    const shuffled: BattleInput = {
      seed: mixed.seed,
      armies: [[...mixed.armies[0]].reverse(), [...mixed.armies[1]].reverse()],
    };
    expect(simulateBattle(shuffled, { record: true })).toEqual(simulateBattle(mixed, { record: true }));
  });

  /**
   * Golden test: fails whenever battle behaviour changes. If the change is intended
   * (rules, unit values, balance knobs), update the expected hash.
   */
  it("matches the golden log", () => {
    const result = simulateBattle(mixed, { record: true });
    expect({ winner: result.winner, ticks: result.ticks, log: hash(result.log) }).toMatchInlineSnapshot(`
      {
        "log": "e0c5666d",
        "ticks": 213,
        "winner": 0,
      }
    `);
  });
});

describe("battle rules", () => {
  it("an empty army loses at once; two empty armies draw", () => {
    expect(simulateBattle({ seed: 1, armies: [[], [one("koloss")]] }).winner).toBe(1);
    expect(simulateBattle({ seed: 1, armies: [[one("koloss")], []] }).winner).toBe(0);
    expect(simulateBattle({ seed: 1, armies: [[], []] }).winner).toBe("draw");
  });

  it("deploys tanks in front of ranged units", () => {
    const r = simulateBattle(
      { seed: 1, armies: [[one("koloss"), one("bogenschuetzen")], [one("koloss"), one("bogenschuetzen")]] },
      { record: true },
    );
    const spawns = r.log!.events.filter((e) => e.type === "spawn");
    for (const side of [0, 1] as const) {
      const mine = spawns.filter((s) => s.side === side);
      const tankY = mine.filter((s) => s.typeId === "koloss").map((s) => s.y);
      const rangedY = mine.filter((s) => s.typeId === "bogenschuetzen").map((s) => s.y);
      // Distance from the center line: tanks closer than every ranged unit.
      const center = BATTLE.fieldHeight / 2;
      const maxTank = Math.max(...tankY.map((y) => Math.abs(y - center)));
      const minRanged = Math.min(...rangedY.map((y) => Math.abs(y - center)));
      expect(maxTank).toBeLessThan(minRanged);
    }
  });

  it("assassins start behind the enemy back line", () => {
    const r = simulateBattle(
      { seed: 1, armies: [[one("schattenrudel")], [one("koloss"), one("bogenschuetzen")]] },
      { record: true },
    );
    const spawns = r.log!.events.filter((e) => e.type === "spawn");
    const enemyMinY = Math.min(...spawns.filter((s) => s.side === 1).map((s) => s.y));
    const assassins = spawns.filter((s) => s.side === 0);
    expect(assassins).toHaveLength(5);
    // Side 1 stands at small y, so "behind" means even smaller y.
    for (const a of assassins) expect(a.y).toBeLessThan(enemyMinY);
  });

  it("sudden death ends battles between tanks before the hard limit", () => {
    for (const u of UNITS.filter((x) => x.role === "tank")) {
      const r = simulateBattle({ seed: 3, armies: [[one(u.id)], [one(u.id)]] });
      expect(r.ticks).toBeLessThan(BATTLE.maxTicks);
    }
  });

  it("rejects invalid levels", () => {
    expect(() => simulateBattle({ seed: 1, armies: [[one("koloss", 1, 4)], []] })).toThrow();
  });

  it("only uses integer coordinates and HP", () => {
    const r = simulateBattle(mixed, { record: true });
    for (const f of r.log!.frames) for (const v of f.pos) expect(Number.isInteger(v)).toBe(true);
    expect(r.remainingHp.every(Number.isInteger)).toBe(true);
  });
});

describe("performance", () => {
  it("simulates a maximum-size battle (105 vs 105) quickly", () => {
    // 21 picks of the 5-unit types per side.
    const big = (ids: string[]): ArmyEntry[] => ids.map((id) => one(id, 7));
    const input: BattleInput = {
      seed: 9,
      armies: [big(["schildtraeger", "bogenschuetzen", "schattenrudel"]), big(["schildtraeger", "bogenschuetzen", "schattenrudel"])],
    };
    const start = performance.now();
    const r = simulateBattle(input, { record: true });
    const ms = performance.now() - start;
    expect(r.log!.events.filter((e) => e.type === "spawn")).toHaveLength(210);
    expect(ms).toBeLessThan(1000);
  });
});
