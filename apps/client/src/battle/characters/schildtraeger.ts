import { bodyMotion, circle, impact, roundRect, swing, type CharacterDraw } from "./paint";
import { belt, clothLeg, eyes, hand, stitches } from "./parts";
import { MAT, TEAM } from "./style";

/**
 * Schildträger: young soldier in a quilted gambeson, kettle helm with team band and rivets,
 * round shield with chevron emblem and boss, leaf-bladed spear. Thrusts forward.
 */
export const drawSchildtraeger: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);

  clothLeg(p, -13, -26, 10, legA, MAT.leather, MAT.iron);
  clothLeg(p, 2, -26, 10, legB, MAT.leather, MAT.iron);

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.05, 1 - hit * 0.06);

  // Spear held diagonally forward, thrust along its axis.
  const thrust = s < 0 ? s * 7 : s * 14;
  const ang = -0.45;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const hx = 14 + dx * thrust;
  const hy = -42 + dy * thrust;
  p.stroke((cc) => {
    cc.moveTo(hx - dx * 24, hy - dy * 24);
    cc.lineTo(hx + dx * 30, hy + dy * 30);
  }, MAT.wood.base, 4);
  const tx = hx + dx * 30;
  const ty = hy + dy * 30;
  p.part3((cc) => roundRect(cc, tx - 3, ty - 3, 6, 6, 1.5), MAT.gold, tx + 1, tx - 1);
  p.part3((cc) => {
    cc.moveTo(tx + dx * 3, ty + dy * 3);
    cc.quadraticCurveTo(tx + dx * 10 - dy * 6, ty + dy * 10 + dx * 6, tx + dx * 18, ty + dy * 18);
    cc.quadraticCurveTo(tx + dx * 10 + dy * 6, ty + dy * 10 - dx * 6, tx + dx * 3, ty + dy * 3);
    cc.closePath();
  }, MAT.steel, tx + dx * 10, tx);
  p.line((cc) => {
    cc.moveTo(tx + dx * 4, ty + dy * 4);
    cc.lineTo(tx + dx * 16, ty + dy * 16);
  }, 0.9);

  // Quilted gambeson with team collar.
  const body = (cc: CanvasRenderingContext2D) => roundRect(cc, -15, -54, 30, 32, 8);
  p.part3(body, { base: "#c7a77a", shade: "#9c7f56", light: "#e2c79c" }, 4, -9);
  p.line((cc) => {
    for (const x of [-7, 0, 7]) {
      cc.moveTo(x, -52);
      cc.lineTo(x, -28);
    }
  }, 1);
  stitches(p, (cc) => {
    cc.moveTo(-13, -44);
    cc.lineTo(13, -44);
    cc.moveTo(-13, -36);
    cc.lineTo(13, -36);
  }, "rgba(80,50,20,0.5)");
  p.part3((cc) => roundRect(cc, -13, -57, 26, 6, 3), team, 4, -7);
  belt(p, -16, -30, 32, 4);

  // Head: face, kettle helm with brim, team band and rivets.
  p.part3((cc) => circle(cc, 2, -70, 15), MAT.skinLight, 8, -6);
  eyes(p, 6, -68, 7, 2.4, 0.15);
  p.line((cc) => {
    cc.moveTo(8, -60.5);
    cc.quadraticCurveTo(10, -59, 12, -60.5);
  }, 1.2);
  p.part3((cc) => {
    cc.moveTo(-14, -76);
    cc.quadraticCurveTo(-13, -91, 2, -91);
    cc.quadraticCurveTo(17, -91, 18, -76);
    cc.closePath();
  }, MAT.steel, 8, -8);
  p.part3((cc) => roundRect(cc, -14, -81, 32, 5, 2), team, 10, -8);
  p.part3((cc) => {
    cc.moveTo(-20, -76);
    cc.lineTo(24, -76);
    cc.quadraticCurveTo(26, -72, 22, -72);
    cc.lineTo(-18, -72);
    cc.quadraticCurveTo(-22, -72, -20, -76);
    cc.closePath();
  }, MAT.steel, 10, -10);
  p.rivets([
    [-9, -84],
    [2, -87],
    [13, -84],
  ], 1.1);
  p.gloss((cc) => roundRect(cc, -9, -89, 3, 9, 1.5), 0.6);

  hand(p, hx, hy, MAT.skinLight);

  // Round shield: steel rim with rivets, team field, white chevron, gold boss.
  const cx = -9;
  const cy = -42;
  p.part3((cc) => circle(cc, cx, cy, 18), MAT.steel, cx + 5, cx - 12);
  p.part3((cc) => circle(cc, cx, cy, 14.5), team, cx + 4, cx - 10);
  p.ctx.save();
  p.ctx.beginPath();
  circle(p.ctx, cx, cy, 14.5);
  p.ctx.clip();
  p.flat((cc) => {
    cc.moveTo(cx - 15, cy + 2);
    cc.lineTo(cx, cy - 9);
    cc.lineTo(cx + 15, cy + 2);
    cc.lineTo(cx + 15, cy + 8);
    cc.lineTo(cx, cy - 3);
    cc.lineTo(cx - 15, cy + 8);
    cc.closePath();
  }, "#f4f1ea");
  p.ctx.restore();
  p.line((cc) => circle(cc, cx, cy, 14.5), 1.3);
  p.rivets([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [cx + Math.cos((i * Math.PI) / 4) * 16.3, cy + Math.sin((i * Math.PI) / 4) * 16.3] as const), 1.1);
  p.part3((cc) => circle(cc, cx, cy + 3, 4.5), MAT.gold, cx + 1, cx - 2);
  p.gloss((cc) => circle(cc, cx - 1.5, cy + 1.5, 1.4), 0.8);

  c.restore();
};
