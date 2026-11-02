import { COUNTERS, RULES, UNITS, getUnitType, type Role } from "@hazeschaden/shared";
import { Rng } from "@hazeschaden/sim";
import { levelUpOptions, mixSeed, type Choice, type MatchState, type PlayerId } from "./match.js";

const ROLES: readonly Role[] = ["tank", "ranged", "assassin"];

/** A random deck with at least one unit of every role. */
export function randomDeck(seed: number): string[] {
  const rng = new Rng(mixSeed(seed, 0xdec));
  const deck: string[] = [];
  for (const role of ROLES) {
    const pool = UNITS.filter((u) => u.role === role);
    deck.push(pool[rng.int(pool.length)]!.id);
  }
  const rest = UNITS.filter((u) => !deck.includes(u.id));
  while (deck.length < RULES.deckSize) {
    const i = rng.int(rest.length);
    deck.push(rest.splice(i, 1)[0]!.id);
  }
  return deck;
}

/** Weight of an army per role: units × 2^(level-1). */
function roleWeights(state: MatchState, player: PlayerId): Record<Role, number> {
  const w: Record<Role, number> = { tank: 0, ranged: 0, assassin: 0 };
  for (const e of state.players[player].army) {
    const u = getUnitType(e.typeId);
    w[u.role] += u.count * e.picks * 2 ** (e.level - 1);
  }
  return w;
}

/**
 * Simple counter-drafting bot: looks at the opponent's strongest role and picks (or levels up)
 * the role that counters it; avoids the role it is countered by. Deterministic.
 */
export function botChoice(state: MatchState, player: PlayerId): Choice {
  const me = state.players[player];
  const opponent: PlayerId = player === 0 ? 1 : 0;
  const weights = roleWeights(state, opponent);
  const dominant = ROLES.reduce<Role | null>((best, r) => (weights[r] > 0 && (best === null || weights[r] > weights[best]) ? r : best), null);

  const roleOf = (id: string): Role => getUnitType(id).role;
  const owned = (id: string): boolean => me.army.some((e) => e.typeId === id);

  if (dominant) {
    const want = ROLES.find((r) => COUNTERS[r] === dominant)!;
    const avoid = COUNTERS[dominant];
    const wanted = me.offer.filter((id) => roleOf(id) === want);
    if (wanted.length > 0) return { kind: "unit", typeId: wanted.find(owned) ?? wanted[0]! };
    const lvl = levelUpOptions(state, player).find((id) => roleOf(id) === want);
    if (lvl) return { kind: "levelUp", typeId: lvl };
    const safe = me.offer.filter((id) => roleOf(id) !== avoid);
    if (safe.length > 0) return { kind: "unit", typeId: safe[0]! };
  }
  const rng = new Rng(mixSeed(state.seed, state.round, state.pickIndex, player, 0xb07));
  return { kind: "unit", typeId: me.offer[rng.int(me.offer.length)]! };
}
