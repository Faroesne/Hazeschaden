import { STRIKE, bodyMotion, circle, ellipse, impact, roundRect, swing, type CharacterDraw } from "./paint";
import { MAT, TEAM } from "./style";

/**
 * Bollwerk: stone golem carrying a brick turret with a team banner on its back. Cracked, mossy
 * boulder body, glowing team-coloured eyes, huge boulder fists. Raises both fists and pounds the ground.
 */
export const drawBollwerk: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);
  const pound = pose.attack !== null && pose.attack >= STRIKE ? hit : 0;

  // Stubby stone legs.
  for (const [x, lift] of [
    [-17, legA * 0.6],
    [4, legB * 0.6],
  ] as const) {
    p.part3((cc) => roundRect(cc, x, -20 - lift, 14, 20, 5), MAT.stone, x + 9, x + 3);
    p.line((cc) => {
      cc.moveTo(x + 3, -12 - lift);
      cc.lineTo(x + 8, -9 - lift);
    }, 1);
  }

  c.save();
  c.translate(0, bob * 0.6 + pound * 3);
  c.scale(1 + pound * 0.06, 1 - pound * 0.08);

  // Brick turret on the back with banner.
  const wave = Math.sin(pose.time * 4) * 3;
  p.stroke((cc) => {
    cc.moveTo(-16, -104);
    cc.lineTo(-16, -124);
  }, MAT.wood.base, 2.5);
  p.part3((cc) => {
    cc.moveTo(-16, -124);
    cc.quadraticCurveTo(-4, -121 + wave, 4, -118);
    cc.quadraticCurveTo(-4, -114 + wave, -16, -111);
    cc.closePath();
  }, team, -6, -12);
  const tower = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-30, -60);
    cc.lineTo(-30, -98);
    for (let i = 0; i < 4; i++) {
      const x = -30 + i * 7;
      cc.lineTo(x, -104);
      cc.lineTo(x + 3.5, -104);
      cc.lineTo(x + 3.5, -98);
      cc.lineTo(x + 7, -98);
    }
    cc.lineTo(-2, -104);
    cc.lineTo(-2, -60);
    cc.closePath();
  };
  p.part3(tower, { base: "#b9a48a", shade: "#8a765e", light: "#d6c4aa" }, -12, -25);
  p.line((cc) => {
    for (let y = -92; y < -62; y += 7) {
      cc.moveTo(-30, y);
      cc.lineTo(-2, y);
      const off = ((y + 92) / 7) % 2 === 0 ? 0 : 5;
      for (let x = -26 + off; x < -2; x += 10) {
        cc.moveTo(x, y);
        cc.lineTo(x, y + 7);
      }
    }
  }, 0.9);
  p.flat((cc) => roundRect(cc, -18, -88, 4, 10, 2), "#140f24");

  // Back fist (behind the body).
  const backY = -36 + (s < 0 ? s * 50 : s * 20);
  p.part3((cc) => circle(cc, -22, backY, 9), MAT.stone, -20, -27);

  // Boulder body with cracks and moss.
  const body = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-24, -20);
    cc.quadraticCurveTo(-30, -48, -16, -66);
    cc.quadraticCurveTo(2, -76, 20, -64);
    cc.quadraticCurveTo(30, -44, 24, -20);
    cc.quadraticCurveTo(0, -12, -24, -20);
    cc.closePath();
  };
  p.part3(body, MAT.stone, 8, -14);
  p.line((cc) => {
    cc.moveTo(-6, -64);
    cc.lineTo(-2, -54);
    cc.lineTo(-8, -46);
    cc.moveTo(12, -36);
    cc.lineTo(18, -30);
    cc.lineTo(16, -24);
    cc.moveTo(-18, -32);
    cc.lineTo(-12, -28);
  }, 1.4);
  p.part3((cc) => {
    cc.moveTo(-18, -62);
    cc.quadraticCurveTo(-10, -72, 4, -70);
    cc.quadraticCurveTo(-2, -64, -8, -66);
    cc.quadraticCurveTo(-12, -60, -18, -62);
    cc.closePath();
  }, MAT.moss, -4, -12);
  // Team rune plate on the chest.
  p.part3((cc) => roundRect(cc, -6, -48, 14, 14, 3), team, 3, -3);
  p.line((cc) => {
    cc.moveTo(1, -45);
    cc.lineTo(1, -37);
    cc.moveTo(-3, -41);
    cc.lineTo(5, -41);
  }, 1.6, MAT.gold.base);

  // Head sunk into the shoulders: brow ridge and glowing eyes.
  p.part3((cc) => roundRect(cc, -2, -80, 24, 18, 6), MAT.stone, 14, 3);
  p.line((cc) => {
    cc.moveTo(0, -74);
    cc.lineTo(22, -73);
  }, 2);
  for (const ex of [7, 15]) {
    c.save();
    c.globalAlpha = 0.45;
    p.flat((cc) => circle(cc, ex, -69, 4.5), team.light);
    c.restore();
    p.flat((cc) => circle(cc, ex, -69, 2.2), "#ffffff");
  }

  // Front fist: raised in the wind-up, pounding down on the strike.
  const fx = 26 + (s > 0 ? s * 6 : 0);
  const fy = -36 + (s < 0 ? s * 54 : s * 26);
  p.stroke((cc) => {
    cc.moveTo(14, -52);
    cc.lineTo(fx - 4, fy);
  }, MAT.stone.base, 11);
  p.part3((cc) => circle(cc, fx, fy, 12), MAT.stone, fx + 3, fx - 6);
  p.line((cc) => {
    for (const dy of [-5, 0, 5]) {
      cc.moveTo(fx + 5, fy + dy);
      cc.lineTo(fx + 10, fy + dy);
    }
  }, 1.2);
  p.part3((cc) => ellipse(cc, fx - 4, fy - 9, 5, 3), MAT.moss, fx - 2, fx - 7);

  c.restore();
};
