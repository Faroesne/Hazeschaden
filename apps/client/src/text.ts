import { BATTLE, COUNTERS, type DamageKind, type Form, type Role, type UnitType } from "@hazeschaden/shared";

export const ROLE_LABEL: Record<Role, string> = { tank: "Tank", ranged: "Fernkampf", assassin: "Assassine" };
export const FORM_LABEL: Record<Form, string> = { mass: "Masse", elite: "Klasse" };
export const DAMAGE_LABEL: Record<DamageKind, string> = { single: "Einzelziel", area: "Fläche" };

export function rangeLabel(u: UnitType): string {
  if (u.range <= 20) return "Nah";
  return u.range < 400 ? "Mittel" : "Weit";
}

export function dps(u: UnitType): number {
  return Math.round((u.damage * BATTLE.ticksPerSecond) / u.attackIntervalTicks);
}

/** Role this unit's role beats. */
export function beats(u: UnitType): string {
  return ROLE_LABEL[COUNTERS[u.role]];
}
