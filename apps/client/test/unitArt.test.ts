import { UNITS } from "@hazeschaden/shared";
import { describe, expect, it } from "vitest";
import { UNIT_ART, unitSvg } from "../src/art/unitArt";

describe("unit art", () => {
  it("has a picture for every unit", () => {
    for (const u of UNITS) expect(UNIT_ART[u.id], u.id).toBeTruthy();
  });

  // Browsers tolerate duplicate attributes inline, but an SVG image (canvas) with one fails to load.
  it("is well-formed: no element repeats an attribute", () => {
    for (const u of UNITS) {
      for (const tag of unitSvg(u.id).match(/<[a-z]+\s[^>]*>/g) ?? []) {
        const names = [...tag.matchAll(/\s([a-z-]+)=/g)].map((m) => m[1]);
        expect(new Set(names).size, `${u.id}: ${tag}`).toBe(names.length);
      }
    }
  });
});
