import { RULES, getUnitType } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import {
  botChoice,
  choose,
  createMatch,
  fightRound,
  levelUpOptions,
  randomDeck,
  timeoutChoice,
  type MatchState,
} from "../src/index.js";

const deckA = ["koloss", "schildtraeger", "bogenschuetzen", "moerser", "klingenmeister"];
const deckB = ["bollwerk", "scharfschuetze", "funkenwerfer", "schattenrudel", "giftmischer"];
const newMatch = (seed = 1) => createMatch({ seed, decks: [deckA, deckB] });

/** Both players take the first offered unit. */
const pickFirst = (s: MatchState): MatchState => {
  let next = choose(s, 0, { kind: "unit", typeId: s.players[0].offer[0]! });
  next = choose(next, 1, { kind: "unit", typeId: next.players[1].offer[0]! });
  return next;
};

describe("createMatch", () => {
  it("starts in round 1, pick 1, with full hearts and an offer from each deck", () => {
    const m = newMatch();
    expect(m.round).toBe(1);
    expect(m.pickIndex).toBe(0);
    expect(m.phase).toBe("draft");
    for (const [i, deck] of [deckA, deckB].entries()) {
      const p = m.players[i]!;
      expect(p.hearts).toBe(RULES.hearts);
      expect(p.offer).toHaveLength(RULES.offerSize);
      expect(new Set(p.offer).size).toBe(RULES.offerSize);
      for (const id of p.offer) expect(deck).toContain(id);
    }
  });

  it("rejects invalid decks", () => {
    expect(() => createMatch({ seed: 1, decks: [deckA.slice(0, 4), deckB] })).toThrow();
    expect(() => createMatch({ seed: 1, decks: [[...deckA.slice(0, 4), "koloss"], deckB] })).toThrow();
    expect(() => createMatch({ seed: 1, decks: [[...deckA.slice(0, 4), "drache"], deckB] })).toThrow();
  });
});

describe("draft", () => {
  it("waits for both players, then applies both picks and moves on", () => {
    let m = newMatch();
    const a = m.players[0].offer[0]!;
    m = choose(m, 0, { kind: "unit", typeId: a });
    expect(m.pickIndex).toBe(0);
    expect(m.players[0].army).toEqual([]);
    expect(m.players[0].pending).not.toBeNull();

    m = choose(m, 1, { kind: "unit", typeId: m.players[1].offer[1]! });
    expect(m.pickIndex).toBe(1);
    expect(m.players[0].army).toEqual([{ typeId: a, picks: 1, level: 1 }]);
    expect(m.players[0].pending).toBeNull();
    expect(m.players[0].picks).toHaveLength(1);
  });

  it("rejects units that are not on offer and a second choice for the same pick", () => {
    const m = newMatch();
    const notOffered = deckA.find((id) => !m.players[0].offer.includes(id))!;
    expect(() => choose(m, 0, { kind: "unit", typeId: notOffered })).toThrow();
    const once = choose(m, 0, { kind: "unit", typeId: m.players[0].offer[0]! });
    expect(() => choose(once, 0, { kind: "unit", typeId: m.players[0].offer[1]! })).toThrow();
  });

  it("picking an owned type adds a pick; level-ups need an owned type and stop at the max level", () => {
    let m = newMatch();
    expect(levelUpOptions(m, 0)).toEqual([]);
    expect(() => choose(m, 0, { kind: "levelUp", typeId: "koloss" })).toThrow();

    m = pickFirst(m);
    const owned = m.players[0].army[0]!.typeId;
    expect(levelUpOptions(m, 0)).toEqual([owned]);

    for (let lvl = 2; lvl <= RULES.maxLevel; lvl++) {
      m = choose(m, 0, { kind: "levelUp", typeId: owned });
      m = choose(m, 1, { kind: "unit", typeId: m.players[1].offer[0]! });
      if (m.phase === "battle") m = fightRound(m).state;
      expect(m.players[0].army.find((e) => e.typeId === owned)!.level).toBe(lvl);
    }
    expect(levelUpOptions(m, 0)).not.toContain(owned);
  });

  it("goes to battle after the last pick of a round", () => {
    let m = newMatch();
    for (let i = 0; i < RULES.picksPerRound; i++) m = pickFirst(m);
    expect(m.phase).toBe("battle");
    expect(m.players[0].army.reduce((n, e) => n + e.picks, 0)).toBe(RULES.picksPerRound);
  });

  it("times out to a unit from the offer", () => {
    const m = newMatch();
    const c = timeoutChoice(m, 1);
    expect(c.kind).toBe("unit");
    expect(m.players[1].offer).toContain(c.typeId);
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

  it("counters the opponent's main role when the offer allows", () => {
    // Player 0 owns only ranged units; the bot (player 1) should take an assassin if offered.
    let m = createMatch({ seed: 3, decks: [["scharfschuetze", "moerser", "bogenschuetzen", "funkenwerfer", "koloss"], deckB] });
    while (m.phase === "draft" && m.round === 1) {
      const ranged = m.players[0].offer.find((id) => getUnitType(id).role === "ranged") ?? m.players[0].offer[0]!;
      m = choose(m, 0, { kind: "unit", typeId: ranged });
      const offer = m.players[1].offer;
      const c = botChoice(m, 1);
      if (m.players[0].picks.length > 0 && offer.some((id) => getUnitType(id).role === "assassin")) {
        expect(c.kind).toBe("unit");
        expect(getUnitType(c.typeId).role).toBe("assassin");
      }
      m = choose(m, 1, c);
    }
  });
});
