import { BATTLE } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { previewDeployment, simulateBattle, type BattleInput } from "../src/index.js";

const input: BattleInput = {
  seed: 4,
  armies: [
    [{ typeId: "koloss", picks: 1, level: 2 }, { typeId: "bogenschuetzen", picks: 1, level: 1 }, { typeId: "schattenrudel", picks: 1, level: 1 }],
    [{ typeId: "schildtraeger", picks: 2, level: 1 }],
  ],
};

describe("previewDeployment", () => {
  it("lists every unit in formation, before assassins teleport", () => {
    const units = previewDeployment(input);
    expect(units).toHaveLength(1 + 5 + 5 + 10);
    const center = BATTLE.fieldHeight / 2;
    const own = units.filter((u) => u.side === 0);
    // Everyone of side 0 stands in its own (bottom) half, assassins included.
    for (const u of own) expect(u.y).toBeGreaterThan(center);
    const depth = (id: string) => Math.min(...own.filter((u) => u.typeId === id).map((u) => u.y - center));
    expect(depth("koloss")).toBeLessThan(depth("bogenschuetzen"));
    expect(depth("bogenschuetzen")).toBeLessThan(depth("schattenrudel"));
  });

  it("matches the battle's units (same ids, types, levels and HP)", () => {
    const spawns = simulateBattle(input, { record: true }).log!.events.filter((e) => e.type === "spawn");
    const preview = previewDeployment(input);
    expect(preview.map((u) => [u.id, u.typeId, u.level, u.hp])).toEqual(spawns.map((s) => [s.id, s.typeId, s.level, s.hp]));
  });
});
