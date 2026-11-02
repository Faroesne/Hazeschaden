/**
 * Optional sprite sheets (real artwork) that replace the code-drawn characters unit by unit.
 * Put images and `manifest.json` into `public/sprites/` (format: public/sprites/README.md).
 * A unit listed in the manifest is drawn from its sheet; every other unit keeps its code figure.
 */

export interface SpriteAnimation {
  /** Row in the sheet (0-based). */
  row: number;
  frames: number;
  /** Frames per second for looping animations (idle, walk). Default 8. */
  fps?: number;
}

export interface SpriteSheetSpec {
  /** One image per team [blue, red], or a single image for both. Relative to /sprites/. */
  images: [string] | [string, string];
  frameWidth: number;
  frameHeight: number;
  /** Where the feet are inside a frame, in pixels from its top-left corner. */
  anchorX: number;
  anchorY: number;
  /** Pixel height of the figure inside a frame (scaled to the in-game figure height). */
  figureHeight: number;
  /** Frames face right; the game mirrors them for units facing left. */
  animations: {
    idle: SpriteAnimation;
    walk?: SpriteAnimation;
    attack?: SpriteAnimation;
    hurt?: SpriteAnimation;
    death?: SpriteAnimation;
  };
}

export type SpriteManifest = Record<string, SpriteSheetSpec>;

export interface SpritePose {
  time: number;
  walking: boolean;
  attack: number | null;
  hurt: number;
}

/** Which animation and frame to show. Pure, so it can be tested without images. */
export function spriteFrame(spec: SpriteSheetSpec, pose: SpritePose, dying?: number): { anim: SpriteAnimation; frame: number } {
  const a = spec.animations;
  const once = (anim: SpriteAnimation, k: number) => ({ anim, frame: Math.min(anim.frames - 1, Math.max(0, Math.floor(k * anim.frames))) });
  const loop = (anim: SpriteAnimation) => ({ anim, frame: Math.floor(pose.time * (anim.fps ?? 8)) % anim.frames });
  if (dying !== undefined && a.death) return once(a.death, dying);
  if (pose.attack !== null && a.attack) return once(a.attack, pose.attack);
  if (pose.hurt > 0 && a.hurt) return once(a.hurt, 1 - pose.hurt);
  if (pose.walking && a.walk) return loop(a.walk);
  return loop(a.idle);
}

const sheets = new Map<string, { spec: SpriteSheetSpec; images: HTMLImageElement[] }>();

/** Loads `sprites/manifest.json` if present. Missing manifest or images are ignored. */
export async function loadSprites(base = "./sprites/"): Promise<void> {
  let manifest: SpriteManifest;
  try {
    const res = await fetch(base + "manifest.json");
    if (!res.ok) return;
    manifest = (await res.json()) as SpriteManifest;
  } catch {
    return;
  }
  await Promise.all(
    Object.entries(manifest).map(async ([typeId, spec]) => {
      try {
        const images = await Promise.all(
          spec.images.map(
            (src) =>
              new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = base + src;
              }),
          ),
        );
        sheets.set(typeId, { spec, images });
      } catch {
        // Broken sheet: keep the code-drawn figure for this unit.
      }
    }),
  );
}

export function hasSprite(typeId: string): boolean {
  return sheets.has(typeId);
}

export function spriteHandlesDeath(typeId: string): boolean {
  return !!sheets.get(typeId)?.spec.animations.death;
}

/** Draws a unit from its sheet with the feet at the origin, `height` world units tall. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  typeId: string,
  pose: SpritePose & { team: 0 | 1 },
  height: number,
  facing: 1 | -1,
  dying?: number,
): void {
  const sheet = sheets.get(typeId);
  if (!sheet) return;
  const { spec, images } = sheet;
  const img = images[pose.team] ?? images[0]!;
  const { anim, frame } = spriteFrame(spec, pose, dying);
  const k = height / spec.figureHeight;
  ctx.save();
  ctx.scale(facing * k, k);
  ctx.drawImage(img, frame * spec.frameWidth, anim.row * spec.frameHeight, spec.frameWidth, spec.frameHeight, -spec.anchorX, -spec.anchorY, spec.frameWidth, spec.frameHeight);
  ctx.restore();
}
