import { COUNTERS, GOALS, UNITS, type UnitType } from "@hazeschaden/shared";
import { simulateBattle } from "./battle.js";
import type { ArmyEntry, BalanceOverrides } from "./types.js";

export interface DuelStats {
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

/** What to evaluate: a unit catalog (default UNITS) and balance knobs (default BALANCE). */
export interface EvalOptions {
  units?: readonly UnitType[];
  balance?: BalanceOverrides;
}

function battleOptions(opts: EvalOptions): { units?: readonly UnitType[]; balance?: BalanceOverrides } {
  const out: { units?: readonly UnitType[]; balance?: BalanceOverrides } = {};
  if (opts.units) out.units = opts.units;
  if (opts.balance) out.balance = opts.balance;
  return out;
}

/**
 * Plays `a` against `b` on `seeds` seeds, each seed once per side, so side bias cancels out.
 * Stats are from `a`'s point of view.
 */
export function duel(
  a: readonly ArmyEntry[],
  b: readonly ArmyEntry[],
  seeds: number,
  opts: EvalOptions = {},
): DuelStats {
  const stats: DuelStats = { wins: 0, losses: 0, draws: 0, games: 0 };
  const options = battleOptions(opts);
  for (let s = 1; s <= seeds; s++) {
    for (const aSide of [0, 1] as const) {
      const armies = aSide === 0 ? ([a, b] as const) : ([b, a] as const);
      const { winner } = simulateBattle({ seed: s * 7919 + aSide, armies }, options);
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
  /** Win rate the expected winner needs: 100, or GOALS.conflictMinWinPct when the form works against it. */
  requiredWinPct: number;
  passed: boolean;
}

/** Mass counters single-target damage; elite counters area damage. */
function formCounters(defender: UnitType, attacker: UnitType): boolean {
  return defender.form === "mass" ? attacker.damageKind === "single" : attacker.damageKind === "area";
}

/**
 * The form works against the expected winner when the opponent's form counters the winner's
 * damage and the winner's form does not counter the opponent's damage in return.
 */
export function formWorksAgainst(winner: UnitType, opponent: UnitType): boolean {
  return formCounters(opponent, winner) && !formCounters(winner, opponent);
}

export function requiredWinPct(winner: UnitType, opponent: UnitType): number {
  return formWorksAgainst(winner, opponent) ? GOALS.conflictMinWinPct : 100;
}

/** Whether `stats` meet a required win rate (in percent). */
export function meetsWinPct(stats: DuelStats, pct: number): boolean {
  return stats.wins * 100 >= stats.games * pct;
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
 * Balance goals from docs/SPEC.md §4 ("always" drops to GOALS.conflictMinWinPct when the form
 * works against the expected winner, see `formWorksAgainst`):
 * - 1 pick vs 1 pick: the counter always wins.
 * - 2 picks vs 1 pick of the counter: the counter loses.
 * - a level counts like a pick: level 2 vs the counter at level 1, the counter loses.
 */
export function checkGoals(seeds: number, opts: EvalOptions = {}): GoalCheck[] {
  const checks: GoalCheck[] = [];
  const check = (kind: GoalKind, winner: UnitType, opponent: UnitType, stats: DuelStats): GoalCheck => {
    const pct = requiredWinPct(winner, opponent);
    return { kind, expectedWinner: winner.id, opponent: opponent.id, stats, requiredWinPct: pct, passed: meetsWinPct(stats, pct) };
  };
  for (const [c, v] of counterPairs(opts.units ?? UNITS)) {
    checks.push(check("1v1", c, v, duel(one(c.id), one(v.id), seeds, opts)));
    checks.push(check("2v1", v, c, duel(two(v.id), one(c.id), seeds, opts)));
    checks.push(check("lvl2v1", v, c, duel(lvl2(v.id), one(c.id), seeds, opts)));
  }
  return checks;
}

/** Win rate (0..100) of each row unit against each column unit, 1 pick each. */
export function winMatrix(seeds: number, opts: EvalOptions = {}): number[][] {
  const units = opts.units ?? UNITS;
  return units.map((a) =>
    units.map((b) => {
      if (a.id === b.id) return 50;
      const s = duel(one(a.id), one(b.id), seeds, opts);
      return Math.round(((s.wins + s.draws / 2) / s.games) * 100);
    }),
  );
}
