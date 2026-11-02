import { RULES } from "@hazeschaden/shared";

export function Hearts({ label, count, side }: { label: string; count: number; side: 0 | 1 }) {
  return (
    <div className={`hearts side-${side}`}>
      <span className="hearts-label">{label}</span>
      <span className="hearts-icons" aria-label={`${count} von ${RULES.hearts} Herzen`}>
        {Array.from({ length: RULES.hearts }, (_, i) => (
          <span key={i} className={i < count ? "heart full" : "heart"}>
            ♥
          </span>
        ))}
      </span>
    </div>
  );
}
