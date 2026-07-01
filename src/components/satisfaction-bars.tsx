export type SatBar = { label: string; pctSat: number | null; pctInsat: number | null };

/**
 * Graphe à barres horizontales par item, façon écoute client : chaque item
 * montre côte à côte sa part de satisfaits (vert) et sa part d'insatisfaits
 * (rouge), sur une même barre 100%. Rendu CSS pur (imprimable, sans JS).
 */
export function SatisfactionBars({ items }: { items: SatBar[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const sat = Math.max(0, Math.min(100, item.pctSat ?? 0));
        const insat = Math.max(0, Math.min(100, item.pctInsat ?? 0));
        const vide = item.pctSat == null && item.pctInsat == null;
        return (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{item.label}</span>
              {vide ? (
                <span className="shrink-0 text-muted-foreground">-</span>
              ) : (
                <span className="shrink-0 font-medium tabular-nums">
                  <span className="text-status-conforme">{item.pctSat ?? 0}% satisfaits</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="text-status-nc-mineure">{item.pctInsat ?? 0}% insatisfaits</span>
                </span>
              )}
            </div>
            <div className="flex h-5 overflow-hidden rounded-md bg-muted">
              <div className="h-full bg-status-conforme" style={{ width: `${sat}%` }} />
              <div className="h-full bg-status-nc-mineure" style={{ width: `${insat}%` }} />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-status-conforme" />
          Satisfaits (note 3-4)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-status-nc-mineure" />
          Insatisfaits (note 1-2)
        </span>
      </div>
    </div>
  );
}
