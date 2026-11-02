import { getUnitType } from "@hazeschaden/shared";
import { DAMAGE_LABEL, FORM_LABEL, ROLE_LABEL, beats, dps, rangeLabel } from "../text";

const ROLE_ICON = { tank: "■", ranged: "▲", assassin: "◆" } as const;

export function UnitCard({
  typeId,
  selected = false,
  owned,
  onClick,
  compact = false,
}: {
  typeId: string;
  selected?: boolean;
  /** Units already in the army, e.g. "×2 · Lv1". */
  owned?: string | undefined;
  onClick?: () => void;
  compact?: boolean;
}) {
  const u = getUnitType(typeId);
  return (
    <button className={`unit-card role-${u.role}${selected ? " selected" : ""}${compact ? " compact" : ""}`} onClick={onClick} disabled={!onClick}>
      <div className="unit-head">
        <span className="unit-icon">{ROLE_ICON[u.role]}</span>
        <span className="unit-name">{u.name}</span>
        <span className="unit-count">×{u.count}</span>
      </div>
      <div className="unit-tags">
        {ROLE_LABEL[u.role]} · {FORM_LABEL[u.form]} · {DAMAGE_LABEL[u.damageKind]}
      </div>
      {!compact && (
        <div className="unit-stats">
          <span>❤ {u.hp}</span>
          <span>⚔ {dps(u)}/s</span>
          <span>↔ {rangeLabel(u)}</span>
        </div>
      )}
      {!compact && <div className="unit-beats">stark gegen {beats(u)}</div>}
      {owned && <div className="unit-owned">{owned}</div>}
    </button>
  );
}
