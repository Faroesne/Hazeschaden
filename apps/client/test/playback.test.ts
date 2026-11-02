import { simulateBattle } from "@hazeschaden/sim";
import { describe, expect, it } from "vitest";
import { createPlayback } from "../src/battle/playback";

const result = simulateBattle(
  {
    seed: 11,
    armies: [
      [{ typeId: "koloss", picks: 1, level: 1 }, { typeId: "bogenschuetzen", picks: 1, level: 1 }],
      [{ typeId: "schildtraeger", picks: 1, level: 1 }, { typeId: "moerser", picks: 1, level: 1 }],
    ],
  },
  { record: true },
);
const pb = createPlayback(result.log!);

describe("battle playback", () => {
  it("ends at the battle's last tick", () => {
    expect(pb.endTick).toBe(result.ticks);
  });

  it("shows every unit at the start with full HP", () => {
    const start = pb.unitsAt(0);
    expect(start).toHaveLength(12);
    for (const u of start) expect(u.hp).toBe(u.maxHp);
  });

  it("shows only the survivors at the end, with the HP the battle reported", () => {
    const end = pb.unitsAt(pb.endTick);
    const alive = end.filter((u) => u.hp > 0);
    expect(alive.filter((u) => u.side === 0)).toHaveLength(result.survivors[0]);
    expect(alive.filter((u) => u.side === 1)).toHaveLength(result.survivors[1]);
    const hpBySide = [0, 1].map((s) => alive.filter((u) => u.side === s).reduce((n, u) => n + u.hp, 0));
    expect(hpBySide).toEqual(result.remainingHp);
  });

  it("interpolates positions between frames", () => {
    const [a, b] = [pb.unitsAt(20), pb.unitsAt(22)];
    const mid = pb.unitsAt(21);
    const id = a[0]!.id;
    const ya = a.find((u) => u.id === id)!.y;
    const yb = b.find((u) => u.id === id)!.y;
    const ym = mid.find((u) => u.id === id)!.y;
    expect(ym).toBeCloseTo((ya + yb) / 2, 5);
  });
});
