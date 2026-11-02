export type Side = 0 | 1;

/** One unit type in an army: how often it was picked and its level. */
export interface ArmyEntry {
  typeId: string;
  /** Number of picks of this type; each pick adds `count` units. */
  picks: number;
  /** 1..RULES.maxLevel */
  level: number;
}

export interface BattleInput {
  seed: number;
  armies: readonly [readonly ArmyEntry[], readonly ArmyEntry[]];
}

export interface BalanceOverrides {
  counterBonusPct?: number;
  levelBonusPct?: number;
}

export interface BattleOptions {
  /** Record the event log for playback and replays. Off for balance runs. */
  record?: boolean;
  balance?: BalanceOverrides;
}

export type BattleWinner = Side | "draw";

export type BattleEvent =
  | { t: number; type: "spawn"; id: number; side: Side; typeId: string; level: number; x: number; y: number; hp: number }
  | { t: number; type: "teleport"; id: number; x: number; y: number }
  | { t: number; type: "attack"; id: number; target: number; arrivesAt: number }
  | { t: number; type: "hit"; id: number; target: number; damage: number; x: number; y: number; area: number }
  | { t: number; type: "suddenDeath"; damagePct: number }
  | { t: number; type: "death"; id: number }
  | { t: number; type: "end"; winner: BattleWinner };

/** Positions of all living units: flat [id, x, y, id, x, y, ...]. */
export interface BattleFrame {
  t: number;
  pos: number[];
}

export interface BattleLog {
  events: BattleEvent[];
  frames: BattleFrame[];
}

export interface BattleResult {
  winner: BattleWinner;
  ticks: number;
  survivors: [number, number];
  /** Remaining HP per side. */
  remainingHp: [number, number];
  log?: BattleLog;
}
