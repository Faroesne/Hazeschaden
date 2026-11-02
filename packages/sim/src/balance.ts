import { COUNTERS, UNITS, type UnitType } from "@hazeschaden/shared";
import { simulateBattle } from "./battle.js";
import type { ArmyEntry, BalanceOverrides } from "./types.js";

export interface DuelStats {
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

/**
 * Plays `a` against `b` on `seeds` seeds, each seed once per side, so side bias cancels out.
 * Stats are from `a`'s point of view.
 */
export function duel(
  a: readonly ArmyEntry[],
  b: readonly ArmyEntry[],
  seeds: number,
  balance: BalanceOverrides = {},
): DuelStats {
  const stats: DuelStats = { wins: 0, losses: 0, draws: 0, games: 0 };
  for (let s = 1; s <= seeds; s++) {
    for (const aSide of [0, 1] as const) {
      const armies = aSide === 0 ? ([a, b] as const) : ([b, a] as const);
      const { winner } = simulateBattle({ seed: s * 7919 + aSide, armies }, { balance });
      stats.games++;
      if (winner === "draw") stats.draws++;
      else if (winner === aSide) stats.wins++;
      else stats.losses++;
    }
  }
  return stats;
}

export type GoalKind = "1v1" | "2v1" | "lvl2v1";

export interface GoalCheck {
  kind: GoalKind;
  /** Unit that must win. */
  expectedWinner: string;
  opponent: string;
  stats: DuelStats;
  passed: boolean;
}

const one = (typeId: string): ArmyEntry[] => [{ typeId, picks: 1, level: 1 }];
const two = (typeId: string): ArmyEntry[] => [{ typeId, picks: 2, level: 1 }];
const lvl2 = (typeId: string): ArmyEntry[] => [{ typeId, picks: 1, level: 2 }];

/** All pairs (counter, victim) where counter's role beats victim's role. */
export function counterPairs(units: readonly UnitType[] = UNITS): [UnitType, UnitType][] {
  const pairs: [UnitType, UnitType][] = [];
  for (const c of units) for (const v of units) if (COUNTERS[c.role] === v.role) pairs.push([c, v]);
  return pairs;
}

/**
 * Balance goals from docs/SPEC.md §4:
 * - 1 pick vs 1 pick: the counter always wins.
 * - 2 picks vs 1 pick of the counter: the counter loses.
 * - a level counts like a pick: level 2 vs the counter at level 1, the counter loses.
 */
export function checkGoals(seeds: number, balance: BalanceOverrides = {}): GoalCheck[] {
  const checks: GoalCheck[] = [];
  const all = (stats: DuelStats): boolean => stats.wins === stats.games;
  for (const [c, v] of counterPairs()) {
    const s1 = duel(one(c.id), one(v.id), seeds, balance);
    checks.push({ kind: "1v1", expectedWinner: c.id, opponent: v.id, stats: s1, passed: all(s1) });
    const s2 = duel(two(v.id), one(c.id), seeds, balance);
    checks.push({ kind: "2v1", expectedWinner: v.id, opponent: c.id, stats: s2, passed: all(s2) });
    const s3 = duel(lvl2(v.id), one(c.id), seeds, balance);
    checks.push({ kind: "lvl2v1", expectedWinner: v.id, opponent: c.id, stats: s3, passed: all(s3) });
  }
  return checks;
}

/** Win rate (0..100) of each row unit against each column unit, 1 pick each. */
export function winMatrix(seeds: number, balance: BalanceOverrides = {}): number[][] {
  return UNITS.map((a) =>
    UNITS.map((b) => {
      if (a.id === b.id) return 50;
      const s = duel(one(a.id), one(b.id), seeds, balance);
      return Math.round(((s.wins + s.draws / 2) / s.games) * 100);
    }),
  );
}
