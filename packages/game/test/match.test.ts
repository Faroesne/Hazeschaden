import { RULES, getUnitType } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import {
  botChoice,
  choose,
  createMatch,
  fightRound,
  randomDeck,
  timeoutChoice,
  type Choice,
  type MatchState,
  type PlayerId,
} from "../src/index.js";

const deckA = ["koloss", "schildtraeger", "bogenschuetzen", "moerser", "klingenmeister"];
const deckB = ["bollwerk", "scharfschuetze", "funkenwerfer", "schattenrudel", "giftmischer"];
const newMatch = (seed = 1) => createMatch({ seed, decks: [deckA, deckB] });

/** Both players take their first offered choice. */
const pickFirst = (s: MatchState): MatchState => {
  const next = choose(s, 0, s.players[0].offer[0]!);
  return choose(next, 1, next.players[1].offer[0]!);
};

/** Plays a whole match where both players use `strategy`; returns every state seen during the draft. */
function playAll(seed: number, strategy: (s: MatchState, p: PlayerId) => Choice): MatchState[] {
  let m = newMatch(seed);
  const seen: MatchState[] = [];
  while (m.phase !== "finished") {
    if (m.phase === "battle") {
      m = fightRound(m).state;
      continue;
    }
    seen.push(m);
    const afterFirst = choose(m, 0, strategy(m, 0));
    m = choose(afterFirst, 1, strategy(afterFirst, 1));
  }
  return seen;
}

describe("createMatch", () => {
  it("starts in round 1, pick 1, with full hearts and three unit choices from each deck", () => {
    const m = newMatch();
    expect(m.round).toBe(1);
    expect(m.pickIndex).toBe(0);
    expect(m.phase).toBe("draft");
    for (const [i, deck] of [deckA, deckB].entries()) {
      const p = m.players[i]!;
      expect(p.hearts).toBe(RULES.hearts);
      expect(p.offer).toHaveLength(RULES.offerSize);
      expect(new Set(p.offer.map((c) => c.typeId)).size).toBe(RULES.offerSize);
      for (const c of p.offer) {
        expect(c.kind).toBe("unit");
        expect(deck).toContain(c.typeId);
      }
    }
  });

  it("rejects invalid decks", () => {
    expect(() => createMatch({ seed: 1, decks: [deckA.slice(0, 4), deckB] })).toThrow();
    expect(() => createMatch({ seed: 1, decks: [[...deckA.slice(0, 4), "koloss"], deckB] })).toThrow();
    expect(() => createMatch({ seed: 1, decks: [[...deckA.slice(0, 4), "drache"], deckB] })).toThrow();
  });
});

describe("offers", () => {
  it("always hold three choices of different unit types; level-ups only for owned types below the max level", () => {
    let levelUpsSeen = 0;
    for (const seed of [1, 2, 3, 4]) {
      for (const m of playAll(seed, (s, p) => s.players[p].offer[0]!)) {
        for (const p of m.players) {
          expect(p.offer).toHaveLength(RULES.offerSize);
          expect(new Set(p.offer.map((c) => c.typeId)).size).toBe(RULES.offerSize);
          for (const c of p.offer) {
            expect(p.deck).toContain(c.typeId);
            if (c.kind !== "levelUp") continue;
            levelUpsSeen++;
            const owned = p.army.find((e) => e.typeId === c.typeId);
            expect(owned).toBeDefined();
            expect(owned!.level).toBeLessThan(RULES.maxLevel);
          }
        }
      }
    }
    expect(levelUpsSeen).toBeGreaterThan(0);
  });

  it("a level-up raises the level of the whole type and is never offered beyond the max level", () => {
    const preferLevelUp = (s: MatchState, p: PlayerId): Choice =>
      s.players[p].offer.find((c) => c.kind === "levelUp") ?? s.players[p].offer[0]!;
    const states = playAll(7, preferLevelUp);
    let ups = 0;
    for (let i = 1; i < states.length; i++) {
      const before = states[i - 1]!.players[0];
      const choice = before.offer.find((c) => c.kind === "levelUp");
      if (!choice) continue;
      const after = states[i]!.players[0];
      const lvl = (army: typeof after.army) => army.find((e) => e.typeId === choice.typeId)!.level;
      expect(lvl(after.army)).toBe(lvl(before.army) + 1);
      ups++;
    }
    expect(ups).toBeGreaterThan(0);
    for (const s of states) for (const e of s.players[0].army) expect(e.level).toBeLessThanOrEqual(RULES.maxLevel);
  });
});

describe("draft", () => {
  it("waits for both players, then applies both picks and moves on", () => {
    let m = newMatch();
    const a = m.players[0].offer[0]!;
    m = choose(m, 0, a);
    expect(m.pickIndex).toBe(0);
    expect(m.players[0].army).toEqual([]);
    expect(m.players[0].pending).not.toBeNull();

    m = choose(m, 1, m.players[1].offer[1]!);
    expect(m.pickIndex).toBe(1);
    expect(m.players[0].army).toEqual([{ typeId: a.typeId, picks: 1, level: 1 }]);
    expect(m.players[0].pending).toBeNull();
    expect(m.players[0].picks).toHaveLength(1);
  });

  it("rejects choices that are not on offer and a second choice for the same pick", () => {
    const m = newMatch();
    const notOffered = deckA.find((id) => !m.players[0].offer.some((c) => c.typeId === id))!;
    expect(() => choose(m, 0, { kind: "unit", typeId: notOffered })).toThrow();
    expect(() => choose(m, 0, { kind: "levelUp", typeId: m.players[0].offer[0]!.typeId })).toThrow();
    const once = choose(m, 0, m.players[0].offer[0]!);
    expect(() => choose(once, 0, m.players[0].offer[1]!)).toThrow();
  });

  it("picking an owned type again adds a pick", () => {
    const states = playAll(3, (s, p) => s.players[p].offer.find((c) => c.kind === "unit" && s.players[p].army.some((e) => e.typeId === c.typeId)) ?? s.players[p].offer[0]!);
    const last = states[states.length - 1]!.players[0];
    expect(last.army.some((e) => e.picks > 1)).toBe(true);
  });

  it("goes to battle after the last pick of a round", () => {
    let m = newMatch();
    for (let i = 0; i < RULES.picksPerRound; i++) m = pickFirst(m);
    expect(m.phase).toBe("battle");
    expect(m.players[0].army.reduce((n, e) => n + e.picks, 0)).toBe(RULES.picksPerRound);
  });

  it("times out to one of the offered choices", () => {
    const m = newMatch();
    expect(m.players[1].offer).toContainEqual(timeoutChoice(m, 1));
  });
});

describe("battle and match end", () => {
  it("the round loser loses a heart and the next round starts with new offers", () => {
    let m = newMatch();
    for (let i = 0; i < RULES.picksPerRound; i++) m = pickFirst(m);
    const { state, battle } = fightRound(m);
    expect(battle.log).toBeDefined();
    const lost = state.players.map((p) => RULES.hearts - p.hearts);
    if (battle.winner === "draw") expect(lost).toEqual([1, 1]);
    else expect(lost[battle.winner === 0 ? 1 : 0]).toBe(1);
    expect(state.round).toBe(2);
    expect(state.phase).toBe("draft");
    expect(state.players[0].offer).toHaveLength(RULES.offerSize);
    expect(state.history).toHaveLength(1);
  });

  it("a bot-vs-bot match ends within 4 to 7 rounds and is deterministic", () => {
    const play = (seed: number) => {
      let m = createMatch({ seed, decks: [randomDeck(seed), randomDeck(seed + 1)] });
      while (m.phase !== "finished") {
        if (m.phase === "battle") m = fightRound(m).state;
        else {
          const afterFirst = choose(m, 0, botChoice(m, 0));
          m = choose(afterFirst, 1, botChoice(afterFirst, 1));
        }
      }
      return m;
    };
    for (const seed of [1, 2, 3, 4, 5]) {
      const m = play(seed);
      expect(m.history.length).toBeGreaterThanOrEqual(RULES.hearts);
      expect(m.history.length).toBeLessThanOrEqual(2 * RULES.hearts - 1);
      expect(m.winner).not.toBeNull();
      expect(play(seed)).toEqual(m);
    }
  });
});

describe("bot", () => {
  it("builds valid decks with every role", () => {
    for (let s = 0; s < 20; s++) {
      const deck = randomDeck(s);
      expect(new Set(deck).size).toBe(RULES.deckSize);
      expect(new Set(deck.map((id) => getUnitType(id).role)).size).toBe(3);
    }
  });

  it("only ever picks from its offer", () => {
    for (const s of playAll(5, botChoice)) {
      expect(s.players[0].offer).toContainEqual(botChoice(s, 0));
    }
  });

  it("counters the opponent's main role when the offer allows", () => {
    // Player 0 owns only ranged units; the bot (player 1) should take an assassin if offered.
    let m = createMatch({ seed: 3, decks: [["scharfschuetze", "moerser", "bogenschuetzen", "funkenwerfer", "koloss"], deckB] });
    while (m.phase === "draft" && m.round === 1) {
      const ranged = m.players[0].offer.find((c) => getUnitType(c.typeId).role === "ranged") ?? m.players[0].offer[0]!;
      m = choose(m, 0, ranged);
      const offer = m.players[1].offer;
      const c = botChoice(m, 1);
      if (m.players[0].picks.length > 0 && offer.some((o) => o.kind === "unit" && getUnitType(o.typeId).role === "assassin")) {
        expect(getUnitType(c.typeId).role).toBe("assassin");
      }
      m = choose(m, 1, c);
    }
  });
});
