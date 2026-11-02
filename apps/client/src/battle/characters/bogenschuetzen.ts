import { STRIKE, bodyMotion, circle, ellipse, roundRect, type CharacterDraw } from "./paint";
import { belt, clothLeg, eyes, hand, stitches } from "./parts";
import { MAT, TEAM } from "./style";

/**
 * Bogenschützen: hooded archers. Team hood with inner shade and stitching, trimmed cape,
 * laced leather jerkin, bracer, quiver with fletchings, longbow with grip wrap. Draw and release.
 */
export const drawBogenschuetzen: CharacterDraw = (p, pose) => {
  const c = p.ctx;
  const team = TEAM[pose.team];
  const { bob, legA, legB } = bodyMotion(pose);
  const pull = pose.attack === null ? 0 : pose.attack < STRIKE ? pose.attack / STRIKE : Math.max(0, 1 - (pose.attack - STRIKE) * 8);
  const sway = Math.sin(pose.time * 3) * 2 + (pose.walking ? 3 : 0);

  // Cape with gold trim and folds.
  const cape = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-11, -58);
    cc.lineTo(9, -58);
    cc.lineTo(6 + sway * 0.3, -14);
    cc.quadraticCurveTo(-8, -9 + sway, -22 + sway, -15);
    cc.closePath();
  };
  p.part3(cape, team, -2, -12);
  p.line((cc) => {
    cc.moveTo(-6, -50);
    cc.quadraticCurveTo(-10, -32, -12 + sway * 0.6, -14);
    cc.moveTo(0, -50);
    cc.quadraticCurveTo(-1, -32, -2 + sway * 0.4, -12);
  }, 1.1, team.shade);
  p.line((cc) => {
    cc.moveTo(6 + sway * 0.3, -14);
    cc.quadraticCurveTo(-8, -9 + sway, -22 + sway, -15);
  }, 2, MAT.gold.base);

  // Quiver with strap and three fletchings.
  c.save();
  c.translate(-13, -48 + bob);
  c.rotate(-0.35);
  for (const [fx, col] of [
    [-3, team.light],
    [0.5, "#f2efe6"],
    [4, team.base],
  ] as const) {
    p.stroke((cc) => {
      cc.moveTo(fx, -10);
      cc.lineTo(fx, -16);
    }, MAT.wood.base, 1.6);
    p.part((cc) => {
      cc.moveTo(fx, -22);
      cc.lineTo(fx + 2.5, -16);
      cc.lineTo(fx - 2.5, -16);
      cc.closePath();
    }, { base: col, shade: col });
  }
  p.part3((cc) => roundRect(cc, -6, -11, 12, 28, 3), MAT.leather, 2, -3);
  p.part3((cc) => roundRect(cc, -6.5, -6, 13, 4, 1.5), MAT.gold, 3, -4);
  c.restore();

  clothLeg(p, -10, -24, 9, legA, { base: "#5e6b3c", shade: "#414b29", light: "#76854c" }, MAT.leather);
  clothLeg(p, 2, -24, 9, legB, { base: "#5e6b3c", shade: "#414b29", light: "#76854c" }, MAT.leather);

  c.save();
  c.translate(0, bob);

  // Laced leather jerkin with a diagonal quiver strap.
  p.part3((cc) => roundRect(cc, -13, -52, 26, 29, 7), MAT.leather, 4, -8);
  p.line((cc) => {
    for (let y = -48; y < -32; y += 4) {
      cc.moveTo(-2, y);
      cc.lineTo(2, y + 2);
      cc.moveTo(2, y);
      cc.lineTo(-2, y + 2);
    }
  }, 0.9, "#f2e2c4");
  p.stroke((cc) => {
    cc.moveTo(-12, -50);
    cc.lineTo(11, -28);
  }, MAT.leather.shade, 3);
  belt(p, -14, -30, 28, -6);

  // Hood with inner shade, stitching and the face peeking out.
  const hood = (cc: CanvasRenderingContext2D) => {
    cc.moveTo(-7, -90);
    cc.quadraticCurveTo(-25, -86, -20, -63);
    cc.quadraticCurveTo(-11, -49, 8, -51);
    cc.quadraticCurveTo(23, -57, 19, -73);
    cc.quadraticCurveTo(13, -90, -7, -90);
    cc.closePath();
  };
  p.part3(hood, team, 5, -12);
  p.flat((cc) => ellipse(cc, 8, -67, 12.5, 13), team.shade);
  p.part3((cc) => ellipse(cc, 8.5, -66, 10, 11), MAT.skinMid, 13, 3);
  stitches(p, (cc) => {
    cc.moveTo(-17, -66);
    cc.quadraticCurveTo(-14, -84, 2, -86);
  });
  eyes(p, 8, -67, 6.5, 2.3, 0.35);
  p.line((cc) => {
    cc.moveTo(10, -59.5);
    cc.lineTo(14, -60);
  }, 1.1);

  // Longbow with grip wrap, string and nocked arrow.
  const bx = 20;
  const sx = bx - 2 - pull * 12;
  p.stroke((cc) => {
    cc.moveTo(bx - 4, -76);
    cc.lineTo(sx, -46);
    cc.lineTo(bx - 4, -16);
  }, "#f2efe6", 1.2);
  p.stroke((cc) => {
    cc.moveTo(bx - 4, -76);
    cc.quadraticCurveTo(bx + 15, -46, bx - 4, -16);
  }, MAT.wood.base, 4.2);
  p.part3((cc) => roundRect(cc, bx + 2, -51, 5, 10, 2), MAT.leather, bx + 5, bx + 3);
  if (pose.attack !== null && pose.attack < STRIKE + 0.02) {
    p.stroke((cc) => {
      cc.moveTo(sx, -46);
      cc.lineTo(sx + 30, -46);
    }, MAT.wood.base, 2);
    p.part3((cc) => {
      cc.moveTo(sx + 37, -46);
      cc.lineTo(sx + 29, -50);
      cc.lineTo(sx + 29, -42);
      cc.closePath();
    }, MAT.steel, sx + 33, sx + 30);
  }
  // Bracer and hands.
  p.part3((cc) => roundRect(cc, bx - 3, -50, 6, 8, 2), MAT.leather, bx + 1, bx - 2);
  hand(p, bx + 4, -46, MAT.skinMid, 4);
  hand(p, sx, -46, MAT.skinMid, 4);
  p.gloss((cc) => circle(cc, bx + 1, -66, 1.4), 0.4);

  c.restore();
};
