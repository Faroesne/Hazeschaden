import { BATTLE, getUnitType } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { previewDeployment, simulateBattle, type ArmyEntry, type BattleInput } from "../src/index.js";

const full = (ids: string[]): ArmyEntry[] => ids.map((typeId) => ({ typeId, picks: 7, level: 1 }));
/** A maximum-size battle: 21 picks of 5-unit types per side. */
const big: BattleInput = {
  seed: 21,
  armies: [full(["schildtraeger", "bogenschuetzen", "schattenrudel"]), full(["schildtraeger", "bogenschuetzen", "schattenrudel"])],
};

describe("arena", () => {
  it("keeps every unit completely inside the arena for the whole battle", () => {
    const log = simulateBattle(big, { record: true }).log!;
    const radius = new Map(log.events.flatMap((e) => (e.type === "spawn" ? [[e.id, e.radius] as const] : [])));
    for (const f of log.frames) {
      for (let i = 0; i < f.pos.length; i += 3) {
        const r = radius.get(f.pos[i]!)!;
        const [x, y] = [f.pos[i + 1]!, f.pos[i + 2]!];
        expect(x - r).toBeGreaterThanOrEqual(0);
        expect(x + r).toBeLessThanOrEqual(BATTLE.fieldWidth);
        expect(y - r).toBeGreaterThanOrEqual(0);
        expect(y + r).toBeLessThanOrEqual(BATTLE.fieldHeight);
      }
    }
  });

  it("deploys a full army in several rows without any units overlapping", () => {
    const units = previewDeployment(big);
    const ys = new Set(units.filter((u) => u.side === 0 && u.typeId === "schildtraeger").map((u) => u.y));
    expect(ys.size).toBeGreaterThan(1);
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const a = units[i]!;
        const b = units[j]!;
        const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        expect(d2).toBeGreaterThanOrEqual((a.radius + b.radius) ** 2);
      }
    }
  });

  it("moves units at a calm pace (at most 80 arena units per second)", () => {
    for (const id of ["koloss", "bogenschuetzen", "klingenmeister"]) {
      expect(getUnitType(id).speed * BATTLE.ticksPerSecond).toBeLessThanOrEqual(80);
    }
  });
});
