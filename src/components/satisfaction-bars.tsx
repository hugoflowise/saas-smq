import { cn } from "@/lib/utils";

export type SatBar = { label: string; pct: number | null };

/** Couleur de la barre selon la performance (top box de satisfaction). */
function tone(pct: number | null): { fill: string; text: string } {
  if (pct == null) return { fill: "bg-muted-foreground/30", text: "text-muted-foreground" };
  if (pct >= 85) return { fill: "bg-status-conforme", text: "text-status-conforme" };
  if (pct >= 70) return { fill: "bg-status-pa", text: "text-status-pa" };
  return { fill: "bg-status-nc-mineure", text: "text-status-nc-mineure" };
}

/**
 * Graphe à barres horizontales « part de satisfaits » par item, façon écoute
 * client : barres épaisses colorées selon un seuil, avec une ligne de cible
 * commune. Rendu CSS pur (imprimable, sans dépendance graphique ni JS).
 */
export function SatisfactionBars({ items, cible = 90 }: { items: SatBar[]; cible?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const width = Math.max(0, Math.min(100, item.pct ?? 0));
        const t = tone(item.pct);
        return (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{item.label}</span>
              <span className={cn("shrink-0 font-semibold tabular-nums", t.text)}>
                {item.pct != null ? `${item.pct}%` : "-"}
              </span>
            </div>
            <div className="relative h-5 overflow-hidden rounded-md bg-muted">
              <div
                className={cn("h-full rounded-md transition-all", t.fill)}
                style={{ width: `${width}%` }}
              />
              {/* Ligne de cible commune à tous les items. */}
              <div
                className="absolute inset-y-0 w-px border-foreground/40 border-l border-dashed"
                style={{ left: `${cible}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-muted-foreground text-xs">
        Part de clients « satisfaits » ou « très satisfaits » par item · cible {cible}% (repère
        pointillé).
      </p>
    </div>
  );
}
