import { BALANCE, type UnitType } from "@hazeschaden/shared";
import { counterPairs, type DuelStats, type GoalCheck, type GoalKind } from "./balance.js";
import { simulateBattle } from "./battle.js";
import { idiv, withPct } from "./math.js";
import type { ArmyEntry, BalanceOverrides } from "./types.js";

export interface TuneOptions {
  /** Seeds per goal check (each played on both sides). Default 6. */
  seeds?: number;
  /** Upper bound on full passes over all units. Default 40. */
  maxPasses?: number;
  balance?: BalanceOverrides;
  /** Catalog the bounds refer to (default: the input). Lets repeated runs start from earlier results. */
  reference?: readonly UnitType[];
  /** HP and damage stay within these percentages of the reference values. Defaults 25 and 400. */
  minFactorPct?: number;
  maxFactorPct?: number;
}

export interface TuneReport {
  passed: boolean;
  /** Goals still failing after tuning. Empty when `passed`. */
  failures: GoalCheck[];
  passes: number;
}

interface CheckSpec {
  key: string;
  kind: GoalKind;
  winnerId: string;
  opponentId: string;
  winnerArmy: ArmyEntry[];
  opponentArmy: ArmyEntry[];
}

/** (hp, damage) directions tried per unit. */
const MOVES = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
] as const;
const STEPS_PCT = [50, 25, 10, 4, 2] as const;

function specsFor(units: readonly UnitType[]): CheckSpec[] {
  const army = (id: string, picks: number, level: number): ArmyEntry[] => [{ typeId: id, picks, level }];
  const specs: CheckSpec[] = [];
  for (const [c, v] of counterPairs(units)) {
    specs.push({ key: `1v1|${c.id}|${v.id}`, kind: "1v1", winnerId: c.id, opponentId: v.id, winnerArmy: army(c.id, 1, 1), opponentArmy: army(v.id, 1, 1) });
    specs.push({ key: `2v1|${v.id}|${c.id}`, kind: "2v1", winnerId: v.id, opponentId: c.id, winnerArmy: army(v.id, 2, 1), opponentArmy: army(c.id, 1, 1) });
    specs.push({ key: `lvl2v1|${v.id}|${c.id}`, kind: "lvl2v1", winnerId: v.id, opponentId: c.id, winnerArmy: army(v.id, 1, 2), opponentArmy: army(c.id, 1, 1) });
  }
  return specs;
}

interface Evaluation {
  stats: DuelStats;
  /**
   * 0 when the expected winner won every game. Each lost game costs 1000 plus up to 1000 more
   * for how much HP the opponent kept, so the tuner also sees progress on games still lost.
   */
  penalty: number;
}

function armyHp(army: readonly ArmyEntry[], catalog: readonly UnitType[], levelPct: number): number {
  let total = 0;
  for (const e of army) {
    const u = catalog.find((x) => x.id === e.typeId)!;
    total += u.count * e.picks * withPct(u.hp, (e.level - 1) * levelPct);
  }
  return Math.max(1, total);
}

/**
 * Adjusts HP and damage of each unit until every balance goal passes (see `checkGoals`),
 * or until no step improves the result any more. Deterministic: same input, same output.
 */
export function tuneUnits(
  input: readonly UnitType[],
  opts: TuneOptions = {},
): { units: UnitType[]; report: TuneReport } {
  const seeds = opts.seeds ?? 6;
  const maxPasses = opts.maxPasses ?? 40;
  const minPct = opts.minFactorPct ?? 25;
  const maxPct = opts.maxFactorPct ?? 400;
  const original = new Map((opts.reference ?? input).map((u) => [u.id, u]));

  const clampToBounds = (value: number, base: number): number =>
    Math.min(withPct(base, maxPct - 100), Math.max(withPct(base, minPct - 100), value));
  let units: UnitType[] = input.map((u) => {
    const ref = original.get(u.id) ?? u;
    return { ...u, hp: clampToBounds(u.hp, ref.hp), damage: clampToBounds(u.damage, ref.damage) };
  });
  const specs = specsFor(units);
  const results = new Map<string, Evaluation>();
  const levelPct = opts.balance?.levelBonusPct ?? BALANCE.levelBonusPct;
  const battleOpts = (catalog: readonly UnitType[]) =>
    opts.balance ? { units: catalog, balance: opts.balance } : { units: catalog };

  const evaluate = (spec: CheckSpec, catalog: readonly UnitType[]): Evaluation => {
    const stats: DuelStats = { wins: 0, losses: 0, draws: 0, games: 0 };
    let penalty = 0;
    const opponentHp = armyHp(spec.opponentArmy, catalog, levelPct);
    for (let s = 1; s <= seeds; s++) {
      for (const wSide of [0, 1] as const) {
        const armies = wSide === 0 ? ([spec.winnerArmy, spec.opponentArmy] as const) : ([spec.opponentArmy, spec.winnerArmy] as const);
        const r = simulateBattle({ seed: s * 7919 + wSide, armies }, battleOpts(catalog));
        stats.games++;
        if (r.winner === wSide) {
          stats.wins++;
          continue;
        }
        if (r.winner === "draw") stats.draws++;
        else stats.losses++;
        const kept = r.remainingHp[wSide === 0 ? 1 : 0];
        penalty += 1000 + Math.min(1000, idiv(1000 * kept, opponentHp));
      }
    }
    return { stats, penalty };
  };

  for (const spec of specs) results.set(spec.key, evaluate(spec, units));
  let score = specs.reduce((sum, s) => sum + results.get(s.key)!.penalty, 0);

  let passes = 0;
  for (const step of STEPS_PCT) {
    while (score > 0 && passes < maxPasses) {
      passes++;
      let improved = false;
      for (let i = 0; i < units.length; i++) {
        for (const [hpDir, dmgDir] of MOVES) {
          const unit = units[i]!;
          const orig = original.get(unit.id)!;
          const nudge = (value: number, base: number, dir: number): number => {
            const lo = withPct(base, minPct - 100);
            const hi = withPct(base, maxPct - 100);
            return Math.min(hi, Math.max(lo, withPct(value, dir * step)));
          };
          const hp = nudge(unit.hp, orig.hp, hpDir);
          const damage = nudge(unit.damage, orig.damage, dmgDir);
          if (hp === unit.hp && damage === unit.damage) continue;

          const candidate = units.slice();
          candidate[i] = { ...unit, hp, damage };
          const touched = specs.filter((s) => s.winnerId === unit.id || s.opponentId === unit.id);
          const fresh = touched.map((s) => evaluate(s, candidate));
          const delta = touched.reduce((d, s, k) => d + fresh[k]!.penalty - results.get(s.key)!.penalty, 0);
          if (delta < 0) {
            units = candidate;
            touched.forEach((s, k) => results.set(s.key, fresh[k]!));
            score += delta;
            improved = true;
          }
        }
      }
      if (!improved) break;
    }
  }

  const failures: GoalCheck[] = specs
    .filter((s) => results.get(s.key)!.penalty > 0)
    .map((s) => ({
      kind: s.kind,
      expectedWinner: s.winnerId,
      opponent: s.opponentId,
      stats: results.get(s.key)!.stats,
      passed: false,
    }));

  return { units, report: { passed: failures.length === 0, failures, passes } };
}
