/**
 * Balance runner.
 *
 *   pnpm balance                 win matrix + balance-goal report
 *   pnpm balance --seeds 20      more seeds per pairing (default 10)
 *   pnpm balance --sweep         search counter/level bonus values with the fewest goal failures
 *   pnpm balance --strict        exit code 1 if any goal fails (for CI)
 *   pnpm balance --counter 40 --level 50   try values without editing BALANCE
 *   pnpm balance --tune          tune HP/damage per unit and write packages/shared/src/tuning.json
 */
import { writeFileSync } from "node:fs";
import { BALANCE, BASE_UNITS, UNITS, type Tuning } from "@hazeschaden/shared";
import { checkGoals, tuneUnits, winMatrix, type BalanceOverrides, type GoalCheck } from "../src/index.js";

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const num = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`);
  const raw = i >= 0 ? args[i + 1] : undefined;
  return raw === undefined ? fallback : Number(raw);
};

const seeds = num("seeds", 10);
const balance: BalanceOverrides = {
  counterBonusPct: num("counter", BALANCE.counterBonusPct),
  levelBonusPct: num("level", BALANCE.levelBonusPct),
};

function short(id: string): string {
  return id.slice(0, 6).padEnd(6);
}

function printMatrix(): void {
  const m = winMatrix(seeds, { balance });
  console.log(`\nSiegquote Zeile gegen Spalte in %, je 1 Pick (${seeds} Seeds × 2 Seiten)\n`);
  console.log("       " + UNITS.map((u) => short(u.id)).join(" "));
  UNITS.forEach((u, i) => {
    const row = m[i]!.map((v) => String(v).padStart(6)).join(" ");
    console.log(`${short(u.id)} ${row}`);
  });
}

function printGoals(checks: GoalCheck[]): void {
  const failed = checks.filter((c) => !c.passed);
  const byKind = (k: GoalCheck["kind"]) => checks.filter((c) => c.kind === k);
  console.log("\nBalance-Ziele");
  for (const kind of ["1v1", "2v1", "lvl2v1"] as const) {
    const list = byKind(kind);
    const ok = list.filter((c) => c.passed).length;
    console.log(`  ${kind.padEnd(7)} ${ok}/${list.length} erfüllt`);
  }
  if (failed.length > 0) {
    console.log("\nVerletzt (soll gewinnen → gegen, Siege/Spiele):");
    for (const c of failed) {
      console.log(`  ${c.kind.padEnd(7)} ${c.expectedWinner} → ${c.opponent}: ${c.stats.wins}/${c.stats.games}`);
    }
  }
}

function sweep(): void {
  const levelValues = [30, 50, 70, 100];
  const sweepSeeds = Math.min(seeds, 4);
  console.log(`Sweep (${sweepSeeds} Seeds): Anzahl verletzter Ziele\n`);
  console.log("counter% " + levelValues.map((l) => `lvl${l}%`.padStart(8)).join(""));
  let best = { failures: Infinity, counter: 0, level: 0 };
  for (let counter = 0; counter <= 150; counter += 10) {
    const cells: string[] = [];
    for (const level of levelValues) {
      const failures = checkGoals(sweepSeeds, { balance: { counterBonusPct: counter, levelBonusPct: level } }).filter(
        (c) => !c.passed,
      ).length;
      if (failures < best.failures) best = { failures, counter, level };
      cells.push(String(failures).padStart(8));
    }
    console.log(String(counter).padStart(8) + " " + cells.join(""));
  }
  console.log(`\nBester Wert: counter ${best.counter}%, level ${best.level}% → ${best.failures} Verletzungen`);
}

function tune(): void {
  console.log(`Tuning (${seeds} Seeds) ... das dauert etwas.`);
  const { units, report } = tuneUnits(UNITS, { seeds, balance, reference: BASE_UNITS });
  const tuning: Tuning = {};
  for (const u of units) tuning[u.id] = { hp: u.hp, damage: u.damage };
  const path = new URL("../../shared/src/tuning.json", import.meta.url);
  writeFileSync(path, JSON.stringify(tuning, null, 2) + "\n");
  console.log(`\n${report.passes} Durchläufe. Geschrieben: packages/shared/src/tuning.json`);
  for (const u of units) {
    const base = BASE_UNITS.find((b) => b.id === u.id)!;
    console.log(`  ${u.id.padEnd(15)} Leben ${String(base.hp).padStart(5)} → ${String(u.hp).padStart(5)}   Schaden ${String(base.damage).padStart(4)} → ${String(u.damage).padStart(4)}`);
  }
  if (report.passed) console.log("\nAlle Balance-Ziele erfüllt.");
  else {
    console.log(`\nNoch ${report.failures.length} Ziele verletzt:`);
    for (const c of report.failures) console.log(`  ${c.kind.padEnd(7)} ${c.expectedWinner} → ${c.opponent}: ${c.stats.wins}/${c.stats.games}`);
  }
}

console.log(`Balance: counter ${balance.counterBonusPct}%, level ${balance.levelBonusPct}%`);
if (flag("tune")) {
  tune();
} else if (flag("sweep")) {
  sweep();
} else {
  printMatrix();
  const checks = checkGoals(seeds, { balance });
  printGoals(checks);
  if (flag("strict") && checks.some((c) => !c.passed)) process.exit(1);
}
