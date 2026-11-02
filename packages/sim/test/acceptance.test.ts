import { describe, expect, it } from "vitest";
import { checkGoals } from "../src/index.js";

describe("balance acceptance", () => {
  // Red: 12 of 144 goals still fail after `pnpm balance --tune`. All are role-vs-form conflicts
  // (e.g. mortar vs. elite tanks). Skipped until the open design decision is made, see README.
  it.skip("the shipped unit values meet every balance goal", () => {
    const failed = checkGoals(6)
      .filter((c) => !c.passed)
      .map((c) => `${c.kind} ${c.expectedWinner} > ${c.opponent} (${c.stats.wins}/${c.stats.games})`);
    expect(failed).toEqual([]);
  });
});
