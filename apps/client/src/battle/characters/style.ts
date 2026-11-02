/** Style tokens from docs/ART_STYLE.md. Change values here and there together. */

export const OUTLINE = "#1b1530";
/** Outline width in character units (figure height = 100). */
export const OUTLINE_WIDTH = 3.6;

export interface Tone {
  base: string;
  shade: string;
  /** Optional highlight on the lit (left) side, used by Painter.part3. */
  light?: string;
}

export interface TeamTone extends Tone {
  light: string;
}

export const TEAM: readonly [TeamTone, TeamTone] = [
  { base: "#3d8bfd", shade: "#1f4fa8", light: "#9cc9ff" },
  { base: "#f0473c", shade: "#a3221c", light: "#ffa59c" },
];

export const MAT = {
  steel: { base: "#c9d3e0", shade: "#8a97ab", light: "#eef3f9" },
  iron: { base: "#5b6274", shade: "#3a3f4d", light: "#7d8598" },
  wood: { base: "#a8743f", shade: "#6f4a25", light: "#c99257" },
  leather: { base: "#8a5531", shade: "#5e3820", light: "#a8703f" },
  gold: { base: "#ffcf3f", shade: "#c9902a", light: "#fff0a8" },
  chain: { base: "#9aa3b4", shade: "#6b7385", light: "#c4cbd8" },
  bronze: { base: "#d08a4a", shade: "#9a5c2a" },
  cloth: { base: "#3a3150", shade: "#241e33", light: "#51466e" },
  skinLight: { base: "#f6cfa6", shade: "#d9a77c" },
  skinMid: { base: "#d39a6a", shade: "#a97549" },
  skinDark: { base: "#8f5d3d", shade: "#6d4329" },
  hairDark: { base: "#3b2a22", shade: "#24180f" },
  beard: { base: "#7a4a26", shade: "#563219" },
  stone: { base: "#9a9cab", shade: "#6b6d7c", light: "#c1c3cf" },
  moss: { base: "#6fa04a", shade: "#4b7531", light: "#94c46a" },
  copper: { base: "#d07a3e", shade: "#9a5226", light: "#efa06a" },
  poison: { base: "#8fe05a", shade: "#4fa82e", light: "#d4ffb0" },
  bone: { base: "#efe6d2", shade: "#c4b796", light: "#fffaf0" },
  fur: { base: "#3b3352", shade: "#251f36", light: "#5a4f7a" },
  thorn: { base: "#4f6b3a", shade: "#334827", light: "#6d8d50" },
  darkLeather: { base: "#4a3a33", shade: "#30251f", light: "#62504a" },
} as const satisfies Record<string, Tone>;

export const FX = {
  spark: "#fff6c2",
  sparkHot: "#ffd24a",
  shockwave: "#ffd76a",
  smoke: "#d9d4e3",
  muzzle: "#ffb43a",
  muzzleHot: "#ff6a2a",
  swoosh: "rgba(255,255,255,0.75)",
  poison: "#8fe05a",
  fire: "#ff8a2a",
  dust: "#c9b48a",
} as const;

export const ARENA = {
  grass: "#5fae4e",
  grassStripe: "#69b957",
  stone: "#8c8f9e",
  stoneDark: "#5b5e6e",
  chalk: "rgba(255,255,255,0.55)",
} as const;

/**
 * Figure height in arena units. All units are nearly the same size (docs/ART_STYLE.md §3):
 * only a slight difference between mass (small radius) and elite units.
 */
export function charHeight(radius: number): number {
  return 58 + radius * 0.5;
}
/** Feet sit this many radii below the unit's position. */
export const FEET_OFFSET_PER_RADIUS = 0.75;
