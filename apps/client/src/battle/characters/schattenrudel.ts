import { STRIKE, circle, ellipse, impact, swing, type CharacterDraw } from "./paint";
import { MAT, TEAM } from "./style";

/**
 * Schattenrudel: shadow wolves. Dark violet fur with a light rim, glowing team-coloured eyes,
 * spiked team collar, bushy tail, four legs with a trotting gait, shadow wisps. Lunges and bites.
 */
export const drawSchattenrudel: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const s = swing(pose.attack);
  const hit = impact(pose.attack);
  const ph = pose.time * (pose.walking ? 3.2 : 0) * Math.PI * 2;
  const breathe = pose.walking ? 0 : Math.sin(pose.time * 4) * 1;
  const lunge = s < 0 ? s * 4 : s * 10;
  const jaw = pose.attack !== null && pose.attack < STRIKE + 0.1 ? Math.max(0, -s) * 0.5 + hit * 0.6 : 0;

  // Shadow wisps.
  c.save();
  c.globalAlpha = 0.35;
  for (let i = 0; i < 3; i++) {
    const k = (pose.time * 1.5 + i / 3) % 1;
    p.flat((cc) => circle(cc, -26 - k * 14, -30 - k * 18 + i * 4, 4 + k * 4), "#6a5a9a");
  }
  c.restore();

  c.save();
  c.translate(lunge, breathe);

  const leg = (x: number, phase: number, front: boolean) => {
    const lift = pose.walking ? Math.max(0, Math.sin(ph + phase)) * 5 : 0;
    const swingX = pose.walking ? Math.cos(ph + phase) * 3 : 0;
    p.part3((cc) => {
      cc.moveTo(x - 3, -24);
      cc.lineTo(x + 3, -24);
      cc.lineTo(x + 2 + swingX, -2 - lift);
      cc.lineTo(x + 6 + swingX, -lift);
      cc.lineTo(x - 3 + swingX, -lift);
      cc.closePath();
    }, front ? MAT.fur : { base: MAT.fur.shade, shade: "#1a1527" }, x + 1, x - 2);
  };
  // Far legs first (darker), then near legs.
  leg(-14, Math.PI, false);
  leg(12, 0, false);

  // Bushy tail.
  const sway = Math.sin(pose.time * 5) * 3;
  p.part3((cc) => {
    cc.moveTo(-20, -30);
    cc.quadraticCurveTo(-36, -36 + sway, -38, -50 + sway);
    cc.quadraticCurveTo(-30, -44 + sway, -26, -40);
    cc.quadraticCurveTo(-30, -34, -18, -26);
    cc.closePath();
  }, MAT.fur, -28, -34);

  // Body.
  p.part3((cc) => ellipse(cc, 0, -30, 25, 12), MAT.fur, 6, -14);
  p.line((cc) => {
    cc.moveTo(-14, -36);
    cc.quadraticCurveTo(-8, -33, -2, -36);
    cc.moveTo(-4, -38);
    cc.quadraticCurveTo(2, -35, 8, -38);
  }, 1, MAT.fur.light);

  leg(-10, 0, true);
  leg(16, Math.PI, true);

  // Spiked team collar.
  p.part3((cc) => ellipse(cc, 19, -36, 5, 10), team, 21, 16);
  for (const dy of [-8, -1, 6]) {
    p.part3((cc) => {
      cc.moveTo(22, -36 + dy - 2);
      cc.lineTo(28, -36 + dy);
      cc.lineTo(22, -36 + dy + 2);
      cc.closePath();
    }, MAT.steel, 200, -200);
  }

  // Head: skull, pointed ears, snout with an opening jaw, glowing eyes.
  c.save();
  c.translate(26, -42);
  c.rotate(-0.1 + hit * 0.15);
  p.part3((cc) => {
    cc.moveTo(-4, -14);
    cc.lineTo(-1, -26);
    cc.lineTo(6, -13);
    cc.closePath();
  }, MAT.fur, 2, -2);
  p.part3((cc) => {
    cc.moveTo(4, -12);
    cc.lineTo(10, -22);
    cc.lineTo(13, -10);
    cc.closePath();
  }, MAT.fur, 11, 7);
  p.part3((cc) => circle(cc, 3, -4, 11), MAT.fur, 7, -4);
  // Lower jaw.
  c.save();
  c.translate(8, 2);
  c.rotate(jaw);
  p.part3((cc) => {
    cc.moveTo(0, -2);
    cc.lineTo(16, -1);
    cc.quadraticCurveTo(14, 4, 2, 4);
    cc.closePath();
  }, { base: MAT.fur.shade, shade: "#1a1527" }, 12, 2);
  p.flat((cc) => {
    cc.moveTo(4, -1);
    cc.lineTo(6, -4);
    cc.lineTo(8, -1);
    cc.moveTo(10, -1);
    cc.lineTo(12, -4);
    cc.lineTo(14, -1);
  }, "#f4f1ea");
  c.restore();
  // Upper snout.
  p.part3((cc) => {
    cc.moveTo(6, -8);
    cc.lineTo(24, -3);
    cc.quadraticCurveTo(25, 1, 21, 2);
    cc.lineTo(6, 3);
    cc.closePath();
  }, MAT.fur, 17, 8);
  p.flat((cc) => circle(cc, 23.5, -2.5, 2), "#140f24");
  if (jaw > 0.15) {
    p.flat((cc) => {
      cc.moveTo(10, 2.5);
      cc.lineTo(12, 6);
      cc.lineTo(14, 2.5);
      cc.moveTo(16, 2.5);
      cc.lineTo(18, 6);
      cc.lineTo(20, 2.5);
    }, "#f4f1ea");
  }
  // Glowing eye.
  c.save();
  c.globalAlpha = 0.5;
  p.flat((cc) => circle(cc, 8, -7, 4.5), team.light);
  c.restore();
  p.flat((cc) => ellipse(cc, 8, -7, 2.6, 1.8), "#ffffff");
  c.restore();

  c.restore();
};
