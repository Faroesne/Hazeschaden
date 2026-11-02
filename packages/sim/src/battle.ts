import { BALANCE, BATTLE, COUNTERS, RULES, UNITS, type UnitType } from "@hazeschaden/shared";
import { clamp, idiv, isqrt, withPct } from "./math.js";
import { Rng } from "./rng.js";
import type {
  ArmyEntry,
  BattleEvent,
  BattleFrame,
  BattleInput,
  BattleOptions,
  BattleResult,
  BattleWinner,
  DeployedUnit,
  Side,
} from "./types.js";

interface Unit {
  id: number;
  side: Side;
  type: UnitType;
  level: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  cooldown: number;
  target: Unit | null;
  /** Damage already on its way to this unit (in-flight projectiles, queued melee hits). */
  pending: number;
  alive: boolean;
}

interface Hit {
  source: Unit;
  target: Unit;
  /** Damage against the primary target; also what was added to its `pending`. */
  primaryDamage: number;
}

const W = BATTLE.fieldWidth;
const H = BATTLE.fieldHeight;
const CENTER_Y = idiv(H, 2);
const EDGE = 8;

/**
 * Runs one battle to the end. Pure and deterministic: the same input always gives the same result.
 * Side 0 deploys in the bottom half, side 1 in the top half.
 */
export function simulateBattle(input: BattleInput, options: BattleOptions = {}): BattleResult {
  const counterPct = options.balance?.counterBonusPct ?? BALANCE.counterBonusPct;
  const levelPct = options.balance?.levelBonusPct ?? BALANCE.levelBonusPct;
  const record = options.record ?? false;

  const rng = new Rng(input.seed);
  const events: BattleEvent[] = [];
  const frames: BattleFrame[] = [];
  const emit = (e: BattleEvent): void => {
    if (record) events.push(e);
  };

  // --- Deploy -------------------------------------------------------------
  const units = deployAll(input, options, levelPct, rng);
  teleportAssassins(units);
  for (const u of units) {
    emit({ t: 0, type: "spawn", id: u.id, side: u.side, typeId: u.type.id, level: u.level, x: u.x, y: u.y, hp: u.hp, radius: u.type.radius });
  }
  if (record) frames.push(snapshot(0, units));

  const hitsByTick = new Map<number, Hit[]>();
  const queueHit = (tick: number, hit: Hit): void => {
    const list = hitsByTick.get(tick);
    if (list) list.push(hit);
    else hitsByTick.set(tick, [hit]);
  };

  const damageAgainst = (source: Unit, victim: Unit): number =>
    COUNTERS[source.type.role] === victim.type.role ? withPct(source.damage, counterPct) : source.damage;

  let winner: BattleWinner = "draw";
  let t = 0;

  // Initial result check: an empty army loses immediately.
  const initial = checkEnd(units);
  if (initial !== null) {
    winner = initial;
  } else {
    for (t = 1; t <= BATTLE.maxTicks; t++) {
      // 1. Resolve hits that arrive now.
      const arriving = hitsByTick.get(t);
      if (arriving) {
        hitsByTick.delete(t);
        for (const hit of arriving) resolveHit(hit, units, damageAgainst, emit, t);
      }

      // 2. Sudden death.
      if (t >= BATTLE.suddenDeathTick && (t - BATTLE.suddenDeathTick) % BATTLE.ticksPerSecond === 0) {
        const seconds = idiv(t - BATTLE.suddenDeathTick, BATTLE.ticksPerSecond);
        const pct = (seconds + 1) * BATTLE.suddenDeathPctPerSecond;
        emit({ t, type: "suddenDeath", damagePct: pct });
        for (const u of units) {
          if (u.alive) u.hp -= Math.max(1, idiv(u.maxHp * pct, 100));
        }
      }

      // 3. Deaths.
      for (const u of units) {
        if (u.alive && u.hp <= 0) {
          u.alive = false;
          emit({ t, type: "death", id: u.id });
        }
      }

      // 4. End check.
      const end = checkEnd(units);
      if (end !== null) {
        winner = end;
        break;
      }

      // 5. Act: target, attack or move.
      for (const u of units) {
        if (!u.alive) continue;
        if (u.cooldown > 0) u.cooldown--;
        const target = pickTarget(u, units);
        if (!target) continue;
        if (inRange(u, target)) {
          if (u.cooldown === 0) {
            const dmg = damageAgainst(u, target);
            const arrivesAt = t + travelTicks(u, target);
            target.pending += dmg;
            queueHit(arrivesAt, { source: u, target, primaryDamage: dmg });
            emit({ t, type: "attack", id: u.id, target: target.id, arrivesAt });
            u.cooldown = u.type.attackIntervalTicks;
          }
        } else {
          moveToward(u, target);
        }
      }

      // 6. Keep units from stacking.
      separate(units);

      if (record && t % BATTLE.frameInterval === 0) frames.push(snapshot(t, units));
    }
    if (t > BATTLE.maxTicks) t = BATTLE.maxTicks;
  }

  emit({ t, type: "end", winner });

  const survivors: [number, number] = [0, 0];
  const remainingHp: [number, number] = [0, 0];
  for (const u of units) {
    if (!u.alive) continue;
    survivors[u.side]++;
    remainingHp[u.side] += Math.max(0, u.hp);
  }

  const result: BattleResult = { winner, ticks: t, survivors, remainingHp };
  if (record) {
    if (frames[frames.length - 1]?.t !== t) frames.push(snapshot(t, units));
    result.log = { events, frames };
  }
  return result;
}

// --- Deployment ------------------------------------------------------------

function deployAll(input: BattleInput, options: BattleOptions, levelPct: number, rng: Rng): Unit[] {
  const catalog = new Map((options.units ?? UNITS).map((u, i) => [u.id, { type: u, order: i }]));
  const units: Unit[] = [];
  for (const side of [0, 1] as const) deploy(side, input.armies[side], catalog, units, levelPct, rng);
  return units;
}

/**
 * Both armies in formation as the battle would deploy them, before assassins teleport.
 * Same ids, types, levels and HP as the battle's spawn events. For showing the field between picks.
 */
export function previewDeployment(input: BattleInput, options: BattleOptions = {}): DeployedUnit[] {
  const levelPct = options.balance?.levelBonusPct ?? BALANCE.levelBonusPct;
  return deployAll(input, options, levelPct, new Rng(input.seed)).map((u) => ({
    id: u.id,
    side: u.side,
    typeId: u.type.id,
    level: u.level,
    x: u.x,
    y: u.y,
    hp: u.hp,
    radius: u.type.radius,
  }));
}

/** Row order from the front line backwards. Assassins stand behind the ranged row. */
const ROW_ORDER = ["tank", "ranged", "assassin"] as const;
const ROW_GAP = 60;
const FRONT_DEPTH = 120;

type Catalog = ReadonlyMap<string, { type: UnitType; order: number }>;

function lookup(catalog: Catalog, typeId: string): { type: UnitType; order: number } {
  const entry = catalog.get(typeId);
  if (!entry) throw new Error(`Unknown unit type: ${typeId}`);
  return entry;
}

function deploy(
  side: Side,
  army: readonly ArmyEntry[],
  catalog: Catalog,
  out: Unit[],
  levelPct: number,
  rng: Rng,
): void {
  const entries = [...army]
    .filter((e) => e.picks > 0)
    .sort((a, b) => lookup(catalog, a.typeId).order - lookup(catalog, b.typeId).order);

  let depth = FRONT_DEPTH;
  for (const role of ROW_ORDER) {
    const roleUnits: { type: UnitType; level: number }[] = [];
    for (const e of entries) {
      const type = lookup(catalog, e.typeId).type;
      if (type.role !== role) continue;
      if (e.level < 1 || e.level > RULES.maxLevel) throw new Error(`Invalid level ${e.level} for ${e.typeId}`);
      for (let i = 0; i < type.count * e.picks; i++) roleUnits.push({ type, level: e.level });
    }
    if (roleUnits.length === 0) continue;

    const spacing = Math.max(...roleUnits.map((u) => u.type.radius)) * 2 + 6;
    const perLine = Math.max(1, idiv(W - 2 * EDGE, spacing));
    for (let start = 0; start < roleUnits.length; start += perLine) {
      const line = roleUnits.slice(start, start + perLine);
      const firstX = idiv(W, 2) - idiv((line.length - 1) * spacing, 2);
      line.forEach((spec, i) => {
        const y = side === 0 ? CENTER_Y + depth : CENTER_Y - depth;
        const maxHp = withPct(spec.type.hp, (spec.level - 1) * levelPct);
        out.push({
          id: out.length,
          side,
          type: spec.type,
          level: spec.level,
          x: clamp(firstX + i * spacing, EDGE, W - EDGE),
          y: clamp(y, EDGE, H - EDGE),
          hp: maxHp,
          maxHp,
          damage: withPct(spec.type.damage, (spec.level - 1) * levelPct),
          // Stagger first attacks so identical units do not fire in the same tick.
          cooldown: rng.int(Math.max(1, idiv(spec.type.attackIntervalTicks, 2))),
          target: null,
          pending: 0,
          alive: true,
        });
      });
      depth += spacing;
    }
    depth += ROW_GAP;
  }
}

/** Assassins jump behind the enemy's back line (the enemy's own assassins excluded, they jump too). */
function teleportAssassins(units: Unit[]): void {
  const plans: { u: Unit; y: number }[] = [];
  for (const side of [0, 1] as const) {
    const enemy = side === 0 ? 1 : 0;
    const jumpers = units.filter((u) => u.side === side && u.type.teleport);
    if (jumpers.length === 0) continue;
    const anchors = units.filter((u) => u.side === enemy && !u.type.teleport);
    const pool = anchors.length > 0 ? anchors : units.filter((u) => u.side === enemy);
    if (pool.length === 0) continue;
    // Enemy side 1 stands at small y; its back is the minimum y. Side 0's back is the maximum y.
    const back = enemy === 1 ? Math.min(...pool.map((u) => u.y)) - 40 : Math.max(...pool.map((u) => u.y)) + 40;
    for (const u of jumpers) plans.push({ u, y: back });
  }
  // Spread each side's jumpers across the width, in id order.
  for (const side of [0, 1] as const) {
    const mine = plans.filter((p) => p.u.side === side);
    if (mine.length === 0) continue;
    const spacing = Math.max(...mine.map((p) => p.u.type.radius)) * 2 + 6;
    const perLine = Math.max(1, idiv(W - 2 * EDGE, spacing));
    mine.forEach((p, i) => {
      const lineIdx = idiv(i, perLine);
      const inLine = i % perLine;
      const lineCount = Math.min(perLine, mine.length - lineIdx * perLine);
      const firstX = idiv(W, 2) - idiv((lineCount - 1) * spacing, 2);
      const away = side === 0 ? -1 : 1; // further behind the enemy line
      p.u.x = clamp(firstX + inLine * spacing, EDGE, W - EDGE);
      p.u.y = clamp(p.y + away * lineIdx * spacing, EDGE, H - EDGE);
    });
  }
}

// --- Targeting -------------------------------------------------------------

function doomed(u: Unit): boolean {
  return u.hp - u.pending <= 0;
}

function dist2(a: Unit, b: Unit): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function inRange(a: Unit, b: Unit): boolean {
  const reach = a.type.range + a.type.radius + b.type.radius;
  return dist2(a, b) <= reach * reach;
}

/** How far back a unit stands on its own side. */
function backness(u: Unit): number {
  return u.side === 0 ? u.y : -u.y;
}

function pickTarget(u: Unit, units: Unit[]): Unit | null {
  const cur = u.target;
  if (cur && cur.alive && !doomed(cur)) {
    if (u.type.role !== "assassin" && !inRange(u, cur)) {
      const alt = nearest(u, units, true);
      if (alt) u.target = alt;
    }
    return u.target;
  }
  u.target = u.type.role === "assassin" ? backmost(u, units) : nearest(u, units, false);
  return u.target;
}

/** Nearest living enemy, preferring ones not already doomed. With `inRangeOnly`, only enemies in reach. */
function nearest(u: Unit, units: Unit[], inRangeOnly: boolean): Unit | null {
  let best: Unit | null = null;
  let bestD = Infinity;
  let bestDoomed = true;
  for (const e of units) {
    if (!e.alive || e.side === u.side) continue;
    if (inRangeOnly && !inRange(u, e)) continue;
    const isDoomed = doomed(e);
    if (inRangeOnly && isDoomed) continue;
    const d = dist2(u, e);
    if ((bestDoomed && !isDoomed) || (isDoomed === bestDoomed && d < bestD)) {
      best = e;
      bestD = d;
      bestDoomed = isDoomed;
    }
  }
  return best;
}

/** Enemy standing furthest back, preferring ones not already doomed; ties go to the nearer one. */
function backmost(u: Unit, units: Unit[]): Unit | null {
  let best: Unit | null = null;
  let bestBack = -Infinity;
  let bestD = Infinity;
  let bestDoomed = true;
  for (const e of units) {
    if (!e.alive || e.side === u.side) continue;
    const isDoomed = doomed(e);
    const b = backness(e);
    const d = dist2(u, e);
    const better =
      (bestDoomed && !isDoomed) ||
      (isDoomed === bestDoomed && (b > bestBack || (b === bestBack && d < bestD)));
    if (better) {
      best = e;
      bestBack = b;
      bestD = d;
      bestDoomed = isDoomed;
    }
  }
  return best;
}

// --- Combat ----------------------------------------------------------------

function travelTicks(u: Unit, target: Unit): number {
  if (u.type.projectileSpeed === 0) return 1;
  const d = isqrt(dist2(u, target));
  return Math.max(1, Math.ceil(d / u.type.projectileSpeed));
}

function resolveHit(
  hit: Hit,
  units: Unit[],
  damageAgainst: (source: Unit, victim: Unit) => number,
  emit: (e: BattleEvent) => void,
  t: number,
): void {
  const { source, target } = hit;
  target.pending -= hit.primaryDamage;
  const area = source.type.areaRadius;
  if (area === 0) {
    if (!target.alive) return;
    target.hp -= hit.primaryDamage;
    emit({ t, type: "hit", id: source.id, target: target.id, x: target.x, y: target.y, area: 0, damages: [target.id, hit.primaryDamage] });
    return;
  }
  // Splash around the target's position (its last position if it already died).
  const damages: number[] = [];
  for (const v of units) {
    if (!v.alive || v.side === source.side) continue;
    const reach = area + v.type.radius;
    const dx = v.x - target.x;
    const dy = v.y - target.y;
    if (dx * dx + dy * dy > reach * reach) continue;
    const dmg = damageAgainst(source, v);
    v.hp -= dmg;
    damages.push(v.id, dmg);
  }
  emit({ t, type: "hit", id: source.id, target: target.id, x: target.x, y: target.y, area, damages });
}

// --- Movement --------------------------------------------------------------

function moveToward(u: Unit, target: Unit): void {
  const dx = target.x - u.x;
  const dy = target.y - u.y;
  const d2 = dx * dx + dy * dy;
  // Ceil, so a unit just outside reach (d2 > reach²) always has a positive distance left to walk.
  let len = isqrt(d2);
  if (len * len < d2) len++;
  if (len === 0) return;
  const need = len - (u.type.range + u.type.radius + target.type.radius);
  if (need <= 0) return;
  const step = Math.min(u.type.speed, need);
  let mx = idiv(dx * step, len);
  let my = idiv(dy * step, len);
  if (mx === 0 && my === 0) {
    // Truncation swallowed a short step; move one unit along the dominant axis.
    if (Math.abs(dx) >= Math.abs(dy)) mx = Math.sign(dx);
    else my = Math.sign(dy);
  }
  u.x = clamp(u.x + mx, EDGE, W - EDGE);
  u.y = clamp(u.y + my, EDGE, H - EDGE);
}

const MAX_RADIUS_SUM = 32;

/** Sweep-and-prune separation: overlapping units push each other apart. */
function separate(units: Unit[]): void {
  const alive = units.filter((u) => u.alive);
  alive.sort((a, b) => a.x - b.x || a.id - b.id);
  for (let i = 0; i < alive.length; i++) {
    const a = alive[i]!;
    for (let j = i + 1; j < alive.length; j++) {
      const b = alive[j]!;
      if (b.x - a.x > MAX_RADIUS_SUM) break;
      const minD = a.type.radius + b.type.radius;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minD * minD) continue;
      let d = isqrt(d2);
      if (d === 0) {
        dx = 1;
        dy = 0;
        d = 1;
      }
      const push = idiv(minD - d + 1, 2);
      let px = idiv(dx * push, d);
      let py = idiv(dy * push, d);
      if (px === 0 && py === 0) {
        if (Math.abs(dx) >= Math.abs(dy)) px = dx >= 0 ? 1 : -1;
        else py = dy >= 0 ? 1 : -1;
      }
      a.x = clamp(a.x - px, EDGE, W - EDGE);
      a.y = clamp(a.y - py, EDGE, H - EDGE);
      b.x = clamp(b.x + px, EDGE, W - EDGE);
      b.y = clamp(b.y + py, EDGE, H - EDGE);
    }
  }
}

// --- Bookkeeping -----------------------------------------------------------

function checkEnd(units: Unit[]): BattleWinner | null {
  let a = 0;
  let b = 0;
  for (const u of units) {
    if (!u.alive) continue;
    if (u.side === 0) a++;
    else b++;
  }
  if (a === 0 && b === 0) return "draw";
  if (a === 0) return 1;
  if (b === 0) return 0;
  return null;
}

function snapshot(t: number, units: Unit[]): BattleFrame {
  const pos: number[] = [];
  for (const u of units) if (u.alive) pos.push(u.id, u.x, u.y);
  return { t, pos };
}
