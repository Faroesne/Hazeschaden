import { simulateBattle, type BattleEvent } from "@hazeschaden/sim";
import { describe, expect, it } from "vitest";
import { ATTACK_RECOVER_TICKS, ATTACK_WINDUP_TICKS, DEATH_TICKS, createPlayback } from "../src/battle/playback";

const log = simulateBattle(
  {
    seed: 3,
    armies: [
      [{ typeId: "koloss", picks: 1, level: 1 }, { typeId: "bogenschuetzen", picks: 1, level: 1 }],
      [{ typeId: "schildtraeger", picks: 1, level: 1 }, { typeId: "klingenmeister", picks: 1, level: 1 }],
    ],
  },
  { record: true },
).log!;
const pb = createPlayback(log);
const events = log.events;
const first = <T extends BattleEvent["type"]>(type: T) => events.find((e) => e.type === type) as Extract<BattleEvent, { type: T }>;

describe("animation state", () => {
  it("winds up before the attack event, strikes on it, and recovers after", () => {
    const a = first("attack");
    const at = (tick: number) => pb.unitsAt(tick).find((u) => u.id === a.id)!.attack;
    expect(at(a.t - ATTACK_WINDUP_TICKS)).toBeCloseTo(0, 5);
    const strike = at(a.t)!;
    expect(strike).toBeGreaterThan(0.2);
    expect(strike).toBeLessThan(0.6);
    expect(at(a.t + ATTACK_RECOVER_TICKS - 1)!).toBeGreaterThan(strike);
  });

  it("faces the target while attacking", () => {
    const a = first("attack");
    const units = pb.unitsAt(a.t);
    const me = units.find((u) => u.id === a.id)!;
    const target = units.find((u) => u.id === a.target)!;
    if (Math.abs(target.x - me.x) > 1) expect(me.facing).toBe(Math.sign(target.x - me.x));
  });

  it("flashes a unit when it gets hit", () => {
    const h = first("hit");
    const victim = h.damages[0]!;
    expect(pb.unitsAt(h.t).find((u) => u.id === victim)!.hurt).toBe(1);
  });

  it("shows dead units falling for a moment at their last position", () => {
    const d = first("death");
    const dying = pb.dyingAt(d.t + DEATH_TICKS / 2).find((u) => u.id === d.id);
    expect(dying).toBeDefined();
    expect(dying!.progress).toBeCloseTo(0.5, 1);
    expect(pb.dyingAt(d.t + DEATH_TICKS + 1).some((u) => u.id === d.id)).toBe(false);
    expect(pb.unitsAt(d.t + 2).some((u) => u.id === d.id)).toBe(false);
  });

  it("marks units as walking while they approach", () => {
    expect(pb.unitsAt(10).some((u) => u.walking)).toBe(true);
  });

  it("gives projectiles their shooter's type, flight progress and direction", () => {
    const shots = Array.from({ length: pb.endTick }, (_, t) => pb.projectilesAt(t)).flat();
    expect(shots.length).toBeGreaterThan(0);
    for (const p of shots) {
      expect(p.typeId).toBe("bogenschuetzen");
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThanOrEqual(1);
      expect(Math.hypot(p.dirX, p.dirY)).toBeCloseTo(1, 5);
    }
  });
});
