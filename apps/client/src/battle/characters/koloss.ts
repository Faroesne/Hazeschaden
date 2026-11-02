import { bodyMotion, circle, impact, legs, roundRect, swing, type CharacterDraw } from "./paint";
import { MAT, TEAM } from "./style";

/** Koloss: broad knight, bucket helm with plume, tower shield, mace. Smashes overhead. */
export const drawKoloss: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const s = swing(pose.attack);
  const hit = impact(pose.attack);

  legs(p, -15, 3, 13, -26, MAT.steel, MAT.iron, legA, legB);

  c.save();
  c.translate(0, bob);
  c.scale(1 + hit * 0.06, 1 - hit * 0.08);

  // Mace arm (behind the body when raised).
  const rest = 0.9;
  const angle = s < 0 ? rest + s * (rest + 2.3) : rest + s * (0.5 - rest) + s * 0.2;
  const shoulder = { x: 15, y: -52 };
  const drawMace = () => {
    c.save();
    c.translate(shoulder.x, shoulder.y);
    c.rotate(angle);
    p.stroke((cc) => {
      cc.moveTo(0, 0);
      cc.lineTo(18, 0);
    }, MAT.steel.base, 9);
    p.stroke((cc) => {
      cc.moveTo(16, 0);
      cc.lineTo(44, 0);
    }, MAT.wood.base, 5);
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      p.part((cc) => {
        cc.moveTo(48 + Math.cos(a) * 6, Math.sin(a) * 6);
        cc.lineTo(48 + Math.cos(a) * 14, Math.sin(a) * 14);
        cc.lineTo(48 + Math.cos(a + 0.5) * 6, Math.sin(a + 0.5) * 6);
        cc.closePath();
      }, MAT.steel);
    }
    p.part((cc) => circle(cc, 48, 0, 9), MAT.iron, 50);
    p.part((cc) => circle(cc, 16, 0, 6), MAT.steel, 17);
    c.restore();
  };

  // Torso: breastplate with team tabard.
  p.part((cc) => roundRect(cc, -23, -60, 46, 38, 10), MAT.steel, 6);
  p.part((cc) => roundRect(cc, -9, -58, 18, 40, 4), team, 3);
  p.part((cc) => roundRect(cc, -24, -33, 48, 7, 3), MAT.leather, 10);
  p.part((cc) => circle(cc, 0, -29.5, 4), MAT.gold);

  // Bucket helm with visor slit and plume.
  p.part((cc) => {
    cc.moveTo(-14, -98);
    cc.bezierCurveTo(-34, -106, -40, -86, -22, -84);
    cc.bezierCurveTo(-30, -96, -18, -98, -10, -96);
    cc.closePath();
  }, team);
  p.part((cc) => roundRect(cc, -19, -98, 38, 40, 13), MAT.steel, 5);
  p.flat((cc) => roundRect(cc, -1, -83, 17, 5, 2), "#1b1530");
  p.flat((cc) => {
    for (const [x, y] of [
      [6, -70],
      [11, -70],
      [8.5, -65],
    ] as const)
      circle(cc, x, y, 1.6);
  }, "#1b1530");
  p.flat((cc) => roundRect(cc, -14, -94, 5, 30, 2.5), "rgba(255,255,255,0.35)");

  // Tower shield in front.
  p.part((cc) => roundRect(cc, -36, -68, 26, 54, 8), MAT.steel, -16);
  p.part((cc) => roundRect(cc, -33, -65, 20, 48, 6), team, -18);
  p.part((cc) => {
    cc.moveTo(-23, -52);
    cc.lineTo(-17, -41);
    cc.lineTo(-23, -30);
    cc.lineTo(-29, -41);
    cc.closePath();
  }, MAT.gold, -22);

  drawMace();
  c.restore();
};
