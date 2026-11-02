import { STRIKE, bodyMotion, circle, impact, roundRect, swing, type CharacterDraw } from "./paint";
import { clothLeg, eyes, hand, stitches } from "./parts";
import { FX, MAT, TEAM } from "./style";

/**
 * Klingenmeister: lean masked swordsman. Layered gi with light rim, striped team scarf, obi with
 * a gold knot, arm wraps, stitched mask, fierce brows, topknot with a gold ring, katana with
 * hamon line, gold tsuba and wrapped grip. Wide slash with a swoosh.
 */
export const drawKlingenmeister: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);
  const sway = Math.sin(pose.time * 4) * 3 + (pose.walking ? 4 : 0);

  // Striped scarf tails behind.
  const tail = (dy: number) => (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-4, -57 + dy);
    cc.quadraticCurveTo(-22, -55 + sway + dy, -36, -46 + sway * 1.4 + dy);
    cc.lineTo(-32, -40 + sway * 1.2 + dy);
    cc.quadraticCurveTo(-18, -48 + sway + dy, -2, -51 + dy);
    cc.closePath();
  };
  p.part3(tail(5), team, -20, -30);
  p.part3(tail(0), team, -20, -30);
  p.line((cc) => {
    cc.moveTo(-10, -55);
    cc.quadraticCurveTo(-22, -52 + sway, -33, -44 + sway * 1.3);
  }, 1.4, team.light);

  const pants = { base: "#2f2843", shade: "#1d1829", light: "#463d61" };
  clothLeg(p, -13, -28, 9, legA, pants, MAT.cloth);
  clothLeg(p, 3, -28, 9, legB, pants, MAT.cloth);
  // Shin wraps.
  p.line((cc) => {
    for (const x of [-13, 3]) for (let y = -20; y < -11; y += 3) {
      cc.moveTo(x, y);
      cc.lineTo(x + 9, y + 1.5);
    }
  }, 1, "#d9d4e3");

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.05, 1 - hit * 0.06);

  const rest = 0.7;
  const angle = s < 0 ? rest + s * (rest + 2.0) : rest + s * 0.9;
  const shoulder = { x: 9, y: -52 };

  if (pose.attack !== null && pose.attack >= STRIKE - 0.02 && pose.attack < STRIKE + 0.3) {
    const k = (pose.attack - STRIKE + 0.02) / 0.32;
    c.save();
    c.globalAlpha = 1 - k;
    c.beginPath();
    c.arc(shoulder.x, shoulder.y, 58, -2.0, angle);
    c.arc(shoulder.x, shoulder.y, 42, angle, -2.0, true);
    c.closePath();
    c.fillStyle = FX.swoosh;
    c.fill();
    c.restore();
  }

  // Layered gi with crossed lapels, obi and gold knot.
  p.part3((cc) => roundRect(cc, -13, -58, 26, 32, 7), MAT.cloth, 4, -8);
  p.part3((cc) => {
    cc.moveTo(-8, -58);
    cc.lineTo(3, -58);
    cc.lineTo(8, -38);
    cc.lineTo(1, -38);
    cc.closePath();
  }, { base: "#4a4064", shade: "#332b47", light: "#5f5480" }, 5, -3);
  p.line((cc) => {
    cc.moveTo(-8, -58);
    cc.lineTo(1, -38);
  }, 1.2, "#8f86ad");
  p.part3((cc) => roundRect(cc, -14, -34, 28, 7, 2.5), team, 6, -8);
  p.part3((cc) => {
    cc.moveTo(-6, -31);
    cc.lineTo(-11, -22);
    cc.lineTo(-6, -23);
    cc.lineTo(-3, -31);
    cc.closePath();
  }, MAT.gold, -6, -9);
  p.part3((cc) => circle(cc, -5, -30.5, 3), MAT.gold, -4, -6);

  // Head: topknot with gold ring, hair, face, stitched mask, fierce eyes.
  p.part3((cc) => circle(cc, -7, -95, 6), MAT.hairDark, -5, -10);
  p.part3((cc) => roundRect(cc, -9.5, -91, 5, 4, 1.5), MAT.gold, -6, -8);
  p.part3((cc) => circle(cc, 2, -74, 16), MAT.skinLight, 9, -7);
  p.part3((cc) => {
    cc.moveTo(-13, -81);
    cc.arc(2, -79, 16, Math.PI * 1.05, Math.PI * 1.95);
    cc.closePath();
  }, MAT.hairDark, 8, -8);
  p.part3((cc) => roundRect(cc, -9, -68, 28, 11, 4), MAT.cloth, 12, -4);
  stitches(p, (cc) => {
    cc.moveTo(-6, -62.5);
    cc.lineTo(17, -62.5);
  }, "rgba(220,215,235,0.5)");
  eyes(p, 7, -72.5, 6.5, 2, 0.6);

  // Sword arm with wraps, katana.
  c.save();
  c.translate(shoulder.x, shoulder.y);
  c.rotate(angle);
  p.stroke((cc) => {
    cc.moveTo(0, 0);
    cc.lineTo(15, 0);
  }, MAT.cloth.base, 7.5);
  p.line((cc) => {
    for (let x = 6; x < 14; x += 2.5) {
      cc.moveTo(x, -3);
      cc.lineTo(x + 1.5, 3);
    }
  }, 1, "#d9d4e3");
  // Wrapped grip.
  p.part3((cc) => roundRect(cc, 10, -2.5, 10, 5, 2), MAT.cloth, 16, 12);
  p.line((cc) => {
    for (let x = 11; x < 20; x += 2.5) {
      cc.moveTo(x, -2.5);
      cc.lineTo(x + 2, 2.5);
    }
  }, 0.8, "#f2efe6");
  p.part3((cc) => roundRect(cc, 19, -6, 4, 12, 2), MAT.gold, 21.5, 20);
  // Blade with hamon line and glint.
  const blade = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(23, -2.8);
    cc.quadraticCurveTo(46, -4, 66, -3);
    cc.lineTo(70, 0);
    cc.quadraticCurveTo(46, 1.8, 23, 2.6);
    cc.closePath();
  };
  p.part3(blade, MAT.steel, 200, 200);
  p.line((cc) => {
    cc.moveTo(25, 0.6);
    cc.quadraticCurveTo(46, -1, 64, -0.8);
  }, 0.8, "#ffffff");
  p.gloss((cc) => roundRect(cc, 40, -2.6, 12, 1.4, 0.7), 0.8);
  hand(p, 13, 0, MAT.skinLight);
  c.restore();

  c.restore();
};
