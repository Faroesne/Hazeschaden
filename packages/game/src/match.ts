import { RULES, UNITS } from "@hazeschaden/shared";
import { Rng, simulateBattle, type ArmyEntry, type BattleResult, type BattleWinner } from "@hazeschaden/sim";

/**
 * Match engine: the rules of one 1v1 match (docs/SPEC.md §1), independent of UI and network.
 * Every function is pure: it returns a new state and never mutates its input.
 */

export type PlayerId = 0 | 1;

export type Choice = { kind: "unit"; typeId: string } | { kind: "levelUp"; typeId: string };

export interface PickRecord {
  round: number;
  pick: number;
  choice: Choice;
}

export interface PlayerState {
  /** 5 unit type ids. */
  deck: readonly string[];
  hearts: number;
  army: readonly ArmyEntry[];
  /** Unit types offered for the current pick. */
  offer: readonly string[];
  /** This pick's choice, hidden from the opponent until both have chosen. */
  pending: Choice | null;
  picks: readonly PickRecord[];
}

export interface RoundResult {
  round: number;
  winner: BattleWinner;
  heartsAfter: [number, number];
  battleSeed: number;
  armies: [readonly ArmyEntry[], readonly ArmyEntry[]];
}

export type Phase = "draft" | "battle" | "finished";

export interface MatchState {
  seed: number;
  /** 1-based. */
  round: number;
  /** 0..RULES.picksPerRound-1 during the draft. */
  pickIndex: number;
  phase: Phase;
  players: readonly [PlayerState, PlayerState];
  history: readonly RoundResult[];
  /** Set when phase is "finished". */
  winner: PlayerId | "draw" | null;
}

const UNIT_IDS = new Set(UNITS.map((u) => u.id));

function mapPlayers(
  players: readonly [PlayerState, PlayerState],
  f: (p: PlayerState, id: PlayerId) => PlayerState,
): [PlayerState, PlayerState] {
  return [f(players[0], 0), f(players[1], 1)];
}

/** Throws if the deck is not exactly RULES.deckSize distinct, known unit types. */
export function validateDeck(deck: readonly string[]): void {
  if (deck.length !== RULES.deckSize) throw new Error(`A deck needs exactly ${RULES.deckSize} unit types.`);
  if (new Set(deck).size !== deck.length) throw new Error("A deck may not contain a unit type twice.");
  for (const id of deck) if (!UNIT_IDS.has(id)) throw new Error(`Unknown unit type: ${id}`);
}

/** Mixes numbers into one 32-bit seed (FNV-1a over the integers). */
export function mixSeed(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    let v = p >>> 0;
    for (let i = 0; i < 4; i++) {
      h ^= v & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
      v >>>= 8;
    }
  }
  return h >>> 0;
}

/** RULES.offerSize distinct unit types from the deck, chosen by seed, round, pick and player. */
export function makeOffer(deck: readonly string[], seed: number, round: number, pick: number, player: PlayerId): string[] {
  const rng = new Rng(mixSeed(seed, round, pick, player, 0x0ffe));
  const pool = [...deck];
  const offer: string[] = [];
  while (offer.length < RULES.offerSize && pool.length > 0) {
    offer.push(pool.splice(rng.int(pool.length), 1)[0]!);
  }
  return offer;
}

export function createMatch(opts: { seed: number; decks: [readonly string[], readonly string[]] }): MatchState {
  opts.decks.forEach(validateDeck);
  const player = (id: PlayerId): PlayerState => ({
    deck: [...opts.decks[id]],
    hearts: RULES.hearts,
    army: [],
    offer: makeOffer(opts.decks[id], opts.seed, 1, 0, id),
    pending: null,
    picks: [],
  });
  return {
    seed: opts.seed >>> 0,
    round: 1,
    pickIndex: 0,
    phase: "draft",
    players: [player(0), player(1)],
    history: [],
    winner: null,
  };
}

/** Unit types this player may level up right now. */
export function levelUpOptions(state: MatchState, player: PlayerId): string[] {
  return state.players[player].army.filter((e) => e.level < RULES.maxLevel).map((e) => e.typeId);
}

export function isValidChoice(state: MatchState, player: PlayerId, choice: Choice): boolean {
  if (state.phase !== "draft") return false;
  const p = state.players[player];
  if (p.pending) return false;
  return choice.kind === "unit" ? p.offer.includes(choice.typeId) : levelUpOptions(state, player).includes(choice.typeId);
}

function applyChoice(army: readonly ArmyEntry[], choice: Choice): ArmyEntry[] {
  const existing = army.find((e) => e.typeId === choice.typeId);
  if (choice.kind === "levelUp") {
    return army.map((e) => (e.typeId === choice.typeId ? { ...e, level: e.level + 1 } : e));
  }
  if (existing) return army.map((e) => (e === existing ? { ...e, picks: e.picks + 1 } : e));
  return [...army, { typeId: choice.typeId, picks: 1, level: 1 }];
}

/**
 * Records a player's choice for the current pick. Once both players have chosen, both choices
 * are applied and the draft moves to the next pick (or to the battle after the last pick).
 */
export function choose(state: MatchState, player: PlayerId, choice: Choice): MatchState {
  if (!isValidChoice(state, player, choice)) {
    throw new Error(`Invalid choice for player ${player}: ${choice.kind} ${choice.typeId}`);
  }
  const players = mapPlayers(state.players, (p, id) => (id === player ? { ...p, pending: choice } : p));
  if (!players[0].pending || !players[1].pending) return { ...state, players };

  const nextPick = state.pickIndex + 1;
  const draftDone = nextPick >= RULES.picksPerRound;
  const resolved = mapPlayers(players, (p, id) => {
    const c = p.pending!;
    return {
      ...p,
      army: applyChoice(p.army, c),
      picks: [...p.picks, { round: state.round, pick: state.pickIndex, choice: c }],
      pending: null,
      offer: draftDone ? [] : makeOffer(p.deck, state.seed, state.round, nextPick, id),
    };
  });

  return {
    ...state,
    players: resolved,
    pickIndex: draftDone ? state.pickIndex : nextPick,
    phase: draftDone ? "battle" : "draft",
  };
}

/** A random valid unit pick, used when the pick timer runs out. Deterministic per pick. */
export function timeoutChoice(state: MatchState, player: PlayerId): Choice {
  const offer = state.players[player].offer;
  const rng = new Rng(mixSeed(state.seed, state.round, state.pickIndex, player, 0x71e0));
  return { kind: "unit", typeId: offer[rng.int(offer.length)]! };
}

/** The other player's picks visible to `viewer`: everything already resolved (never pending choices or offers). */
export function visiblePicks(state: MatchState, viewer: PlayerId): readonly PickRecord[] {
  return state.players[viewer === 0 ? 1 : 0].picks;
}

/**
 * Plays the round's battle. The loser loses a heart; on a draw both do.
 * Ends the match when a player has no hearts left (both at 0: draw).
 */
export function fightRound(state: MatchState): { state: MatchState; battle: BattleResult } {
  if (state.phase !== "battle") throw new Error("No battle to fight in phase " + state.phase);
  const battleSeed = mixSeed(state.seed, state.round, 0xba77);
  const armies: [readonly ArmyEntry[], readonly ArmyEntry[]] = [state.players[0].army, state.players[1].army];
  const battle = simulateBattle({ seed: battleSeed, armies }, { record: true });

  const hearts: [number, number] = [state.players[0].hearts, state.players[1].hearts];
  if (battle.winner === "draw") {
    hearts[0]--;
    hearts[1]--;
  } else {
    hearts[battle.winner === 0 ? 1 : 0]--;
  }

  const result: RoundResult = { round: state.round, winner: battle.winner, heartsAfter: [hearts[0], hearts[1]], battleSeed, armies };
  const over = hearts[0] <= 0 || hearts[1] <= 0;
  const winner: MatchState["winner"] = !over ? null : hearts[0] <= 0 && hearts[1] <= 0 ? "draw" : hearts[0] <= 0 ? 1 : 0;
  const nextRound = state.round + 1;

  const players = mapPlayers(state.players, (p, id) => ({
    ...p,
    hearts: hearts[id],
    offer: over ? [] : makeOffer(p.deck, state.seed, nextRound, 0, id),
  }));

  return {
    battle,
    state: {
      ...state,
      players,
      history: [...state.history, result],
      phase: over ? "finished" : "draft",
      round: over ? state.round : nextRound,
      pickIndex: 0,
      winner,
    },
  };
}
