/** Match rules. See docs/SPEC.md §1. */
export const RULES = {
  hearts: 4,
  deckSize: 5,
  offerSize: 3,
  picksPerRound: 3,
  pickSeconds: 10,
  maxLevel: 3,
  reconnectSeconds: 60,
} as const;

/**
 * Balance knobs. All integers (percent), so the simulation stays integer-only.
 * Tuned with `pnpm balance --sweep`.
 */
export const BALANCE = {
  /** Extra damage dealt to the role this unit counters. */
  counterBonusPct: 40,
  /** Extra HP and damage per level above 1. 100 tuned best in `--sweep` + `--tune` (50 left ~17 goals failing). */
  levelBonusPct: 100,
} as const;

/** Battle simulation constants. See docs/SPEC.md §4. */
export const BATTLE = {
  ticksPerSecond: 20,
  fieldWidth: 1000,
  fieldHeight: 1400,
  /** Sudden death starts after this many ticks (30 s). */
  suddenDeathTick: 600,
  /** Each sudden-death second deals (seconds since start + 1) × this percent of max HP. */
  suddenDeathPctPerSecond: 2,
  /** Hard stop; reached only by a bug. Counts as a draw. */
  maxTicks: 2400,
  /** Position snapshots in the event log every N ticks. */
  frameInterval: 2,
} as const;
