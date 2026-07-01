export type SatBar = { label: string; pctSat: number | null; pctInsat: number | null };

/**
 * Liste fine et épurée « part de satisfaits » par item : chaque ligne aligne
 * l'intitulé, une barre mince dont le remplissage vert représente les
 * satisfaits (le fond rosé restant = insatisfaits), et le pourcentage.
 * Rendu CSS pur (imprimable, sans JS ni dépendance graphique).
 */
export function SatisfactionBars({ items }: { items: SatBar[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item) => {
        const sat = Math.max(0, Math.min(100, item.pctSat ?? 0));
        const vide = item.pctSat == null && item.pctInsat == null;
        return (
          <div key={item.label} className="flex items-center gap-4">
            <span
              className="w-40 shrink-0 truncate text-muted-foreground text-sm sm:w-64"
              title={item.label}
            >
              {item.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-status-nc-mineure/15">
              {!vide ? (
                <div
                  className="h-full rounded-full bg-status-conforme"
                  style={{ width: `${sat}%` }}
                />
              ) : null}
            </div>
            <span className="w-9 shrink-0 text-right font-medium text-sm tabular-nums">
              {item.pctSat != null ? `${item.pctSat}%` : "-"}
            </span>
          </div>
        );
      })}
      <p className="flex items-center gap-4 pt-1 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-full bg-status-conforme" />
          Satisfaits
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-4 rounded-full bg-status-nc-mineure/25" />
          Insatisfaits
        </span>
      </p>
    </div>
  );
}
