/** Style tokens from docs/ART_STYLE.md. Change values here and there together. */

export const OUTLINE = "#1b1530";
/** Outline width in character units (figure height = 100). */
export const OUTLINE_WIDTH = 3.6;

export interface Tone {
  base: string;
  shade: string;
}

export interface TeamTone extends Tone {
  light: string;
}

export const TEAM: readonly [TeamTone, TeamTone] = [
  { base: "#3d8bfd", shade: "#1f4fa8", light: "#9cc9ff" },
  { base: "#f0473c", shade: "#a3221c", light: "#ffa59c" },
];

export const MAT = {
  steel: { base: "#c9d3e0", shade: "#8a97ab" },
  iron: { base: "#5b6274", shade: "#3a3f4d" },
  wood: { base: "#a8743f", shade: "#6f4a25" },
  leather: { base: "#8a5531", shade: "#5e3820" },
  gold: { base: "#ffcf3f", shade: "#c9902a" },
  bronze: { base: "#d08a4a", shade: "#9a5c2a" },
  cloth: { base: "#3a3150", shade: "#241e33" },
  skinLight: { base: "#f6cfa6", shade: "#d9a77c" },
  skinMid: { base: "#d39a6a", shade: "#a97549" },
  skinDark: { base: "#8f5d3d", shade: "#6d4329" },
  hairDark: { base: "#3b2a22", shade: "#24180f" },
  beard: { base: "#7a4a26", shade: "#563219" },
} as const satisfies Record<string, Tone>;

export const FX = {
  spark: "#fff6c2",
  sparkHot: "#ffd24a",
  shockwave: "#ffd76a",
  smoke: "#d9d4e3",
  muzzle: "#ffb43a",
  muzzleHot: "#ff6a2a",
  swoosh: "rgba(255,255,255,0.75)",
} as const;

export const ARENA = {
  grass: "#5fae4e",
  grassStripe: "#69b957",
  stone: "#8c8f9e",
  stoneDark: "#5b5e6e",
  chalk: "rgba(255,255,255,0.55)",
} as const;

/** Figure height = collision radius × this. */
export const CHAR_HEIGHT_PER_RADIUS = 3;
/** Feet sit this many radii below the unit's position. */
export const FEET_OFFSET_PER_RADIUS = 0.75;
