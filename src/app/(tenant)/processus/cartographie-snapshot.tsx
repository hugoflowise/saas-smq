import { charteColors } from "@/components/document-paper";

export type ProcessusType = "pilotage" | "realisation" | "support";

/** Instantané figé d'une cartographie : familles + processus au moment de la publication. */
export type CartographieSnapshot = {
  charte: string | null;
  processus: { nom: string; type: ProcessusType; description: string | null }[];
};

const COLUMNS: { type: ProcessusType; label: string }[] = [
  { type: "pilotage", label: "Processus de pilotage" },
  { type: "realisation", label: "Processus de réalisation" },
  { type: "support", label: "Processus support" },
];

/** Bande latérale (entrées à gauche, sorties à droite) — identique à la carte vivante. */
function SideBand({ label, side }: { label: string; side: "left" | "right" }) {
  const band = (
    <div className="flex w-full items-center justify-center rounded-md bg-muted px-3 py-4 text-center font-semibold text-[11px] text-muted-foreground uppercase leading-snug tracking-wide lg:h-full lg:w-32">
      {label}
    </div>
  );
  const chevron = (
    <div
      aria-hidden
      className="hidden size-0 self-center border-y-[14px] border-y-transparent border-l-[14px] border-l-muted lg:block"
    />
  );
  return (
    <div className="flex shrink-0 items-stretch gap-0 lg:w-36">
      {side === "left" ? (
        <>
          {band}
          {chevron}
        </>
      ) : (
        <>
          {chevron}
          {band}
        </>
      )}
    </div>
  );
}

/**
 * Rendu en lecture seule d'une cartographie figée (sans liens, alertes de revue
 * ni contrôles de validation) : utilisé dans l'historique des versions.
 */
export function CartographieSnapshotView({ snapshot }: { snapshot: CartographieSnapshot }) {
  const { charte, contrast } = charteColors(snapshot.charte);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      <SideBand label="Besoins clients et attentes des parties prenantes pertinentes" side="left" />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {COLUMNS.map((col) => {
          const colItems = snapshot.processus.filter((p) => p.type === col.type);
          return (
            <section key={col.type} className="overflow-hidden rounded-md border">
              <div
                className="px-4 py-2 text-center font-semibold text-sm uppercase tracking-wide"
                style={{ backgroundColor: charte, color: contrast }}
              >
                {col.label}
              </div>
              <div className="flex flex-wrap gap-3 bg-surface p-3">
                {colItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun processus.</p>
                ) : (
                  colItems.map((p) => (
                    <div
                      key={p.nom}
                      className="flex min-w-[180px] flex-1 basis-[200px] flex-col overflow-hidden rounded-md border bg-card px-3 py-2.5 text-sm"
                    >
                      <p className="font-medium">{p.nom}</p>
                      {p.description ? (
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <SideBand label="Satisfaction client et des parties prenantes pertinentes" side="right" />
    </div>
  );
}
