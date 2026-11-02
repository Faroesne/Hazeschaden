import { describe, expect, it } from "vitest";
import { spriteFrame, type SpriteSheetSpec } from "../src/battle/sprites";

const spec: SpriteSheetSpec = {
  images: ["x.png"],
  frameWidth: 64,
  frameHeight: 64,
  anchorX: 32,
  anchorY: 60,
  figureHeight: 56,
  animations: {
    idle: { row: 0, frames: 4, fps: 4 },
    walk: { row: 1, frames: 6, fps: 12 },
    attack: { row: 2, frames: 6 },
    death: { row: 3, frames: 5 },
  },
};
const pose = { time: 0, walking: false, attack: null, hurt: 0 };

describe("spriteFrame", () => {
  it("loops idle and walk by time", () => {
    expect(spriteFrame(spec, { ...pose, time: 0.5 })).toEqual({ anim: spec.animations.idle, frame: 2 });
    expect(spriteFrame(spec, { ...pose, time: 1.25 })).toEqual({ anim: spec.animations.idle, frame: 1 });
    expect(spriteFrame(spec, { ...pose, walking: true, time: 0.5 })).toEqual({ anim: spec.animations.walk, frame: 0 });
  });

  it("plays the attack once across its progress, ahead of walking", () => {
    expect(spriteFrame(spec, { ...pose, walking: true, attack: 0 }).frame).toBe(0);
    expect(spriteFrame(spec, { ...pose, attack: 0.5 })).toEqual({ anim: spec.animations.attack, frame: 3 });
    expect(spriteFrame(spec, { ...pose, attack: 1 }).frame).toBe(5);
  });

  it("uses the death row while dying and falls back to idle when an animation is missing", () => {
    expect(spriteFrame(spec, pose, 0.99)).toEqual({ anim: spec.animations.death, frame: 4 });
    expect(spriteFrame(spec, { ...pose, hurt: 1 }).anim).toBe(spec.animations.idle);
  });
});
