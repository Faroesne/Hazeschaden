import type { BattleLog, Side } from "@hazeschaden/sim";

/** What the renderer needs to draw one moment of a battle. Pure: derived from the event log only. */

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
}

export interface ProjectileView {
  x: number;
  y: number;
  side: Side;
}

export interface HitView {
  x: number;
  y: number;
  area: number;
  /** 0..1, 1 = just landed. */
  fresh: number;
}

export interface Playback {
  endTick: number;
  unitsAt(tick: number): UnitView[];
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

const HIT_FADE_TICKS = 6;

export function createPlayback(log: BattleLog): Playback {
  const spawns = new Map<number, Spawn>();
  const hpChanges = new Map<number, { t: number; hp: number }[]>();
  const attacks: { t: number; arrivesAt: number; id: number; target: number }[] = [];
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
        break;
      case "attack":
        if (e.arrivesAt - e.t > 1) attacks.push(e);
        break;
      case "hit":
        hits.push({ t: e.t, x: e.x, y: e.y, area: e.area });
        for (let i = 0; i < e.damages.length; i += 2) {
          const id = e.damages[i]!;
          const next = (hp.get(id) ?? 0) - e.damages[i + 1]!;
          hp.set(id, next);
          hpChanges.get(id)?.push({ t: e.t, hp: next });
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
      case "end":
        endTick = e.t;
        break;
      default:
        break;
    }
  }

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

  return {
    endTick,
    unitsAt(tick) {
      const pos = positionsAt(tick);
      const out: UnitView[] = [];
      for (const [id, p] of pos) {
        const s = spawns.get(id)!;
        out.push({ id, side: s.side, typeId: s.typeId, level: s.level, radius: s.radius, x: p.x, y: p.y, hp: Math.max(0, hpAt(id, tick)), maxHp: s.maxHp });
      }
      return out;
    },
    projectilesAt(tick) {
      const pos = positionsAt(tick);
      const out: ProjectileView[] = [];
      for (const a of attacks) {
        if (a.t > tick || a.arrivesAt < tick) continue;
        const from = positionsAt(a.t).get(a.id);
        const to = pos.get(a.target) ?? positionsAt(a.arrivesAt).get(a.target);
        if (!from || !to) continue;
        const k = (tick - a.t) / (a.arrivesAt - a.t);
        out.push({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, side: spawns.get(a.id)!.side });
      }
      return out;
    },
    hitsAt(tick) {
      const out: HitView[] = [];
      for (const h of hits) {
        const age = tick - h.t;
        if (age < 0 || age > HIT_FADE_TICKS) continue;
        out.push({ x: h.x, y: h.y, area: h.area, fresh: 1 - age / HIT_FADE_TICKS });
      }
      return out;
    },
    suddenDeathAt(tick) {
      return tick >= suddenDeathTick;
    },
  };
}
