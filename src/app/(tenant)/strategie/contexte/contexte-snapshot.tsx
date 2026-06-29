import { formatDate } from "@/lib/format";

export type ContexteSwot = {
  forces: string[];
  faiblesses: string[];
  opportunites: string[];
  menaces: string[];
};
export type ContextePestel = {
  politique: string[];
  economique: string[];
  sociologique: string[];
  technologique: string[];
  ecologique: string[];
  legal: string[];
};

/** Instantané figé d'une analyse de contexte au moment de la publication. */
export type ContexteSnapshot = {
  reference?: string | null;
  swot: ContexteSwot;
  pestel: ContextePestel;
  dateRevue?: string | null;
  prochainRevue?: string | null;
};

const SWOT_FIELDS: { key: keyof ContexteSwot; label: string; dot: string; accent: string }[] = [
  {
    key: "forces",
    label: "Forces",
    dot: "bg-status-conforme",
    accent: "border-status-conforme/40",
  },
  {
    key: "faiblesses",
    label: "Faiblesses",
    dot: "bg-status-nc-mineure",
    accent: "border-status-nc-mineure/40",
  },
  {
    key: "opportunites",
    label: "Opportunités",
    dot: "bg-status-pf",
    accent: "border-status-pf/40",
  },
  { key: "menaces", label: "Menaces", dot: "bg-status-pa", accent: "border-status-pa/40" },
];

const PESTEL_FIELDS: { key: keyof ContextePestel; label: string; lettre: string }[] = [
  { key: "politique", label: "Politique", lettre: "P" },
  { key: "economique", label: "Économique", lettre: "É" },
  { key: "sociologique", label: "Sociologique", lettre: "S" },
  { key: "technologique", label: "Technologique", lettre: "T" },
  { key: "ecologique", label: "Écologique", lettre: "E" },
  { key: "legal", label: "Légal", lettre: "L" },
];

/** Liste de points en lecture seule (vide → « - »). */
function Points({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-muted-foreground text-xs">-</p>;
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-1.5">
          <span className="text-muted-foreground text-xs">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Rendu en lecture seule d'une analyse de contexte figée (historique des versions). */
export function ContexteSnapshotView({ snapshot }: { snapshot: ContexteSnapshot }) {
  return (
    <div className="flex flex-col gap-6">
      {snapshot.reference?.trim() ? (
        <p className="text-muted-foreground text-sm">
          Référence : <span className="font-medium text-foreground">{snapshot.reference}</span>
        </p>
      ) : null}

      <section>
        <h3 className="mb-3 font-semibold text-sm">Analyse SWOT</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SWOT_FIELDS.map((f) => (
            <div
              key={f.key}
              className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${f.accent}`}
            >
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${f.dot}`} />
                <span className="font-semibold text-sm">{f.label}</span>
              </div>
              <Points items={snapshot.swot[f.key] ?? []} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-sm">Analyse PESTEL</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PESTEL_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary text-xs">
                  {f.lettre}
                </span>
                <span className="font-semibold text-sm">{f.label}</span>
              </div>
              <Points items={snapshot.pestel[f.key] ?? []} />
            </div>
          ))}
        </div>
      </section>

      {snapshot.dateRevue || snapshot.prochainRevue ? (
        <p className="text-muted-foreground text-sm">
          Revue : {formatDate(snapshot.dateRevue ?? null)} · Prochaine :{" "}
          {formatDate(snapshot.prochainRevue ?? null)}
        </p>
      ) : null}
    </div>
  );
}
