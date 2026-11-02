import type { BattleLog, Side } from "@hazeschaden/sim";

/**
 * What the renderer needs to draw one moment of a battle. Pure: derived from the event log only.
 * Because the whole battle is known in advance, animations can start *before* an event
 * (e.g. winding up before a strike). Timings follow docs/ART_STYLE.md §4.
 */

export const ATTACK_WINDUP_TICKS = 4;
export const ATTACK_RECOVER_TICKS = 8;
export const HURT_TICKS = 3;
export const DEATH_TICKS = 12;
const HIT_FADE_TICKS = 6;
const WALK_EPSILON = 0.15;

export interface UnitView {
  id: number;
  side: Side;
  typeId: string;
  level: number;
  radius: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  /** Attack animation progress 0..1 (strike at ATTACK_WINDUP / total), or null when not attacking. */
  attack: number | null;
  /** 1 right after being hit, fading to 0. */
  hurt: number;
  /** Horizontal facing: towards the target while attacking, else the walking direction. */
  facing: 1 | -1;
  walking: boolean;
}

export interface DyingView extends UnitView {
  /** 0 at the moment of death, 1 when gone. */
  progress: number;
}

export interface ProjectileView {
  x: number;
  y: number;
  side: Side;
  typeId: string;
  /** 0 at launch, 1 on impact. */
  progress: number;
  /** Unit vector of the flight direction. */
  dirX: number;
  dirY: number;
}

export interface HitView {
  x: number;
  y: number;
  area: number;
  /** 0..1, 1 = just landed. */
  fresh: number;
  /** Stable per hit, for deterministic particle patterns. */
  seed: number;
}

export interface Playback {
  endTick: number;
  unitsAt(tick: number): UnitView[];
  dyingAt(tick: number): DyingView[];
  projectilesAt(tick: number): ProjectileView[];
  hitsAt(tick: number): HitView[];
  suddenDeathAt(tick: number): boolean;
}

interface Spawn {
  side: Side;
  typeId: string;
  level: number;
  radius: number;
  maxHp: number;
}

interface Attack {
  t: number;
  arrivesAt: number;
  id: number;
  target: number;
}

/** Largest index i with list[i] <= value, or -1. */
function lastAtOrBefore(list: readonly number[], value: number): number {
  let lo = 0;
  let hi = list.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid]! <= value) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

export function createPlayback(log: BattleLog): Playback {
  const spawns = new Map<number, Spawn>();
  const hpChanges = new Map<number, { t: number; hp: number }[]>();
  const projectiles: Attack[] = [];
  const attacksBy = new Map<number, Attack[]>();
  const hurtBy = new Map<number, number[]>();
  const deaths: { id: number; t: number }[] = [];
  const hits: { t: number; x: number; y: number; area: number }[] = [];
  let suddenDeathTick = Infinity;
  let endTick = 0;

  const hp = new Map<number, number>();
  for (const e of log.events) {
    switch (e.type) {
      case "spawn":
        spawns.set(e.id, { side: e.side, typeId: e.typeId, level: e.level, radius: e.radius, maxHp: e.hp });
        hp.set(e.id, e.hp);
        hpChanges.set(e.id, [{ t: 0, hp: e.hp }]);
        attacksBy.set(e.id, []);
        hurtBy.set(e.id, []);
        break;
      case "attack":
        attacksBy.get(e.id)!.push(e);
        if (e.arrivesAt - e.t > 1) projectiles.push(e);
        break;
      case "hit":
        hits.push({ t: e.t, x: e.x, y: e.y, area: e.area });
        for (let i = 0; i < e.damages.length; i += 2) {
          const id = e.damages[i]!;
          const next = (hp.get(id) ?? 0) - e.damages[i + 1]!;
          hp.set(id, next);
          hpChanges.get(id)?.push({ t: e.t, hp: next });
          hurtBy.get(id)?.push(e.t);
        }
        break;
      case "suddenDeath":
        suddenDeathTick = Math.min(suddenDeathTick, e.t);
        for (const [id, s] of spawns) {
          const next = (hp.get(id) ?? 0) - Math.max(1, Math.trunc((s.maxHp * e.damagePct) / 100));
          hp.set(id, next);
          hpChanges.get(id)!.push({ t: e.t, hp: next });
        }
        break;
      case "death":
        deaths.push({ id: e.id, t: e.t });
        break;
      case "end":
        endTick = e.t;
        break;
      default:
        break;
    }
  }
  const attackTimes = new Map([...attacksBy].map(([id, list]) => [id, list.map((a) => a.t)]));

  const frames = log.frames;
  /** Index of the last frame with t <= tick. */
  const frameIndex = (tick: number): number => {
    let lo = 0;
    let hi = frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (frames[mid]!.t <= tick) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  const positionsAt = (tick: number): Map<number, { x: number; y: number }> => {
    const i = frameIndex(tick);
    const a = frames[i]!;
    const b = frames[Math.min(i + 1, frames.length - 1)]!;
    const k = b.t > a.t ? Math.min(1, Math.max(0, (tick - a.t) / (b.t - a.t))) : 0;
    const next = new Map<number, { x: number; y: number }>();
    for (let j = 0; j < b.pos.length; j += 3) next.set(b.pos[j]!, { x: b.pos[j + 1]!, y: b.pos[j + 2]! });
    const out = new Map<number, { x: number; y: number }>();
    for (let j = 0; j < a.pos.length; j += 3) {
      const id = a.pos[j]!;
      const ax = a.pos[j + 1]!;
      const ay = a.pos[j + 2]!;
      const nb = next.get(id);
      out.set(id, nb ? { x: ax + (nb.x - ax) * k, y: ay + (nb.y - ay) * k } : { x: ax, y: ay });
    }
    return out;
  };

  const hpAt = (id: number, tick: number): number => {
    const list = hpChanges.get(id)!;
    let cur = list[0]!.hp;
    for (const c of list) {
      if (c.t > tick) break;
      cur = c.hp;
    }
    return cur;
  };

  /** The attack whose animation window [t - windup, t + recover) contains `tick`, if any. */
  const attackAt = (id: number, tick: number): { attack: Attack; progress: number } | null => {
    const times = attackTimes.get(id)!;
    // Prefer an upcoming strike (its wind-up) over the tail of the previous one.
    const next = lastAtOrBefore(times, tick + ATTACK_WINDUP_TICKS);
    for (const i of [next, next - 1]) {
      const t = times[i];
      if (t === undefined) continue;
      const start = t - ATTACK_WINDUP_TICKS;
      const end = t + ATTACK_RECOVER_TICKS;
      if (tick >= start && tick < end) return { attack: attacksBy.get(id)![i]!, progress: (tick - start) / (end - start) };
    }
    return null;
  };

  const hurtAt = (id: number, tick: number): number => {
    const times = hurtBy.get(id)!;
    const i = lastAtOrBefore(times, tick);
    if (i < 0) return 0;
    const age = tick - times[i]!;
    return age >= HURT_TICKS ? 0 : 1 - age / HURT_TICKS;
  };

  const view = (
    id: number,
    p: { x: number; y: number },
    prev: { x: number; y: number } | undefined,
    tick: number,
    targets: Map<number, { x: number; y: number }>,
  ): UnitView => {
    const s = spawns.get(id)!;
    const vx = prev ? p.x - prev.x : 0;
    const vy = prev ? p.y - prev.y : 0;
    const atk = attackAt(id, tick);
    let facing: 1 | -1 = s.side === 0 ? 1 : -1;
    const target = atk ? (targets.get(atk.attack.target) ?? positionsAt(atk.attack.t).get(atk.attack.target)) : undefined;
    if (target && Math.abs(target.x - p.x) > 1) facing = target.x > p.x ? 1 : -1;
    else if (Math.abs(vx) > WALK_EPSILON) facing = vx > 0 ? 1 : -1;
    return {
      id,
      side: s.side,
      typeId: s.typeId,
      level: s.level,
      radius: s.radius,
      x: p.x,
      y: p.y,
      hp: Math.max(0, hpAt(id, tick)),
      maxHp: s.maxHp,
      attack: atk ? atk.progress : null,
      hurt: hurtAt(id, tick),
      facing,
      walking: Math.hypot(vx, vy) > WALK_EPSILON,
    };
  };

  return {
    endTick,
    unitsAt(tick) {
      const pos = positionsAt(tick);
      const prev = positionsAt(tick - 1);
      const out: UnitView[] = [];
      for (const [id, p] of pos) out.push(view(id, p, prev.get(id), tick, pos));
      return out;
    },
    dyingAt(tick) {
      const out: DyingView[] = [];
      for (const d of deaths) {
        const age = tick - d.t;
        if (age < 0 || age > DEATH_TICKS) continue;
        const last = positionsAt(d.t - 1).get(d.id) ?? positionsAt(d.t - 2).get(d.id);
        if (!last) continue;
        out.push({ ...view(d.id, last, undefined, d.t - 1, new Map()), attack: null, hurt: 0, hp: 0, walking: false, progress: age / DEATH_TICKS });
      }
      return out;
    },
    projectilesAt(tick) {
      const pos = positionsAt(tick);
      const out: ProjectileView[] = [];
      for (const a of projectiles) {
        if (a.t > tick || a.arrivesAt < tick) continue;
        const from = positionsAt(a.t).get(a.id);
        const to = pos.get(a.target) ?? positionsAt(a.arrivesAt).get(a.target);
        if (!from || !to) continue;
        const k = (tick - a.t) / (a.arrivesAt - a.t);
        const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
        const s = spawns.get(a.id)!;
        out.push({
          x: from.x + (to.x - from.x) * k,
          y: from.y + (to.y - from.y) * k,
          side: s.side,
          typeId: s.typeId,
          progress: k,
          dirX: (to.x - from.x) / len,
          dirY: (to.y - from.y) / len,
        });
      }
      return out;
    },
    hitsAt(tick) {
      const out: HitView[] = [];
      hits.forEach((h, i) => {
        const age = tick - h.t;
        if (age < 0 || age > HIT_FADE_TICKS) return;
        out.push({ x: h.x, y: h.y, area: h.area, fresh: 1 - age / HIT_FADE_TICKS, seed: i });
      });
      return out;
    },
    suddenDeathAt(tick) {
      return tick >= suddenDeathTick;
    },
  };
}
