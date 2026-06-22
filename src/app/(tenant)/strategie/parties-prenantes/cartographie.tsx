import Link from "next/link";
import { PRIORITE_LABELS } from "@/lib/parties-prenantes";

type CartoItem = { id: string; nom: string; sphere: string; priorite: number };

// Couleur pleine de la pastille selon la priorité (basse / moyenne / haute).
const DOT: Record<number, string> = {
  1: "bg-muted-foreground/50",
  2: "bg-status-pa",
  3: "bg-status-nc-mineure",
};

// Rayons (en % du conteneur, centre = 50/50) : anneau interne plus proche du centre.
const R_INTERNE = 27;
const R_EXTERNE = 43;

/** Position {left, top} en % sur un cercle de rayon r, i-ème sur n (départ en haut). */
function position(i: number, n: number, r: number): { left: string; top: string } {
  const angle = (-90 + (360 / Math.max(n, 1)) * i) * (Math.PI / 180);
  return {
    left: `${50 + r * Math.cos(angle)}%`,
    top: `${50 + r * Math.sin(angle)}%`,
  };
}

function Noeud({ p, pos }: { p: CartoItem; pos: { left: string; top: string } }) {
  return (
    <Link
      href={`/strategie/parties-prenantes/${p.id}`}
      style={pos}
      className="-translate-x-1/2 -translate-y-1/2 absolute flex max-w-[120px] items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs shadow-soft transition-colors hover:border-primary hover:bg-muted"
      title={`${p.nom} · priorité ${PRIORITE_LABELS[p.priorite]}`}
    >
      <span className={`size-2 shrink-0 rounded-full ${DOT[p.priorite] ?? DOT[1]}`} />
      <span className="min-w-0 truncate font-medium">{p.nom}</span>
    </Link>
  );
}

export function Cartographie({ parties }: { parties: CartoItem[] }) {
  const internes = parties.filter((p) => p.sphere === "interne");
  const externes = parties.filter((p) => p.sphere === "externe");

  if (parties.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune partie prenante. Ajoutez-en pour construire la cartographie.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-square w-full max-w-xl">
        {/* Anneaux décoratifs */}
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full border border-border border-dashed"
          style={{ width: `${R_EXTERNE * 2}%`, height: `${R_EXTERNE * 2}%` }}
        />
        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full border border-primary/30 border-dashed bg-primary/5"
          style={{ width: `${R_INTERNE * 2}%`, height: `${R_INTERNE * 2}%` }}
        />

        {/* Étiquettes des sphères */}
        <span className="-translate-x-1/2 absolute top-[5%] left-1/2 text-muted-foreground text-xs">
          Sphère externe
        </span>
        <span className="-translate-x-1/2 absolute top-[19%] left-1/2 font-medium text-primary text-xs">
          Sphère interne
        </span>

        {/* Centre : l'organisme */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex size-[22%] flex-col items-center justify-center rounded-full bg-primary text-center text-primary-foreground">
          <span className="px-2 font-semibold text-xs leading-tight">Notre organisme</span>
        </div>

        {/* Noeuds */}
        {internes.map((p, i) => (
          <Noeud key={p.id} p={p} pos={position(i, internes.length, R_INTERNE)} />
        ))}
        {externes.map((p, i) => (
          <Noeud key={p.id} p={p} pos={position(i, externes.length, R_EXTERNE)} />
        ))}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
        <span className="font-medium">Priorité :</span>
        {[3, 2, 1].map((niveau) => (
          <span key={niveau} className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${DOT[niveau]}`} />
            {PRIORITE_LABELS[niveau]}
          </span>
        ))}
      </div>
    </div>
  );
}
