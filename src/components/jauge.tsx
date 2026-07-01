import { cn } from "@/lib/utils";

/** Ton de couleur d'une jauge, aligné sur les tokens de statut. */
export type JaugeTone = "conforme" | "pf" | "pa" | "nc-mineure";

const TONE_VAR: Record<JaugeTone, string> = {
  conforme: "var(--color-status-conforme)",
  pf: "var(--color-status-pf)",
  pa: "var(--color-status-pa)",
  "nc-mineure": "var(--color-status-nc-mineure)",
};

/**
 * Jauge circulaire (anneau) rendue en CSS pur (conic-gradient), donc sans JS ni
 * dépendance graphique. `pct` sur 0-100 ; `value`/`sub` s'affichent au centre.
 */
export function Jauge({
  pct,
  value,
  sub,
  tone = "conforme",
  size = 132,
}: {
  pct: number | null;
  value: string;
  sub?: string;
  tone?: JaugeTone;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, pct ?? 0));
  const deg = Math.round(clamped * 3.6);
  const color = TONE_VAR[tone];
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${deg}deg, var(--muted) ${deg}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-card text-center">
        <span
          className={cn(
            "font-semibold text-2xl leading-none",
            pct == null && "text-muted-foreground",
          )}
        >
          {value}
        </span>
        {sub ? <span className="mt-1 text-muted-foreground text-xs">{sub}</span> : null}
      </div>
    </div>
  );
}
