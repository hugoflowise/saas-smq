import Link from "next/link";
import { PRIORITE_LABELS } from "@/lib/parties-prenantes";

type CartoItem = { id: string; nom: string; sphere: string; priorite: number };

// Couleur pleine de la pastille selon la priorité (basse / moyenne / haute).
const DOT: Record<number, string> = {
  1: "bg-muted-foreground/50",
  2: "bg-status-pa",
  3: "bg-status-nc-mineure",
};

// Espacement angulaire cible par nœud (px de circonférence) : garantit la lisibilité.
const ESPACEMENT = 150;
const ORG_R = 60; // rayon du disque central (organisme)

/**
 * Calcule les rayons des anneaux et la taille du conteneur en fonction du
 * nombre de parties : le cercle s'agrandit pour que tout reste lisible.
 * - nœuds internes placés DANS la sphère interne (entre le disque et son bord) ;
 * - nœuds externes placés DANS l'anneau externe.
 */
function geometrie(nInternes: number, nExternes: number) {
  const rInternes = Math.max(ORG_R + 70, (nInternes * ESPACEMENT) / (2 * Math.PI));
  const rBordInterne = rInternes + 46; // bord visuel de la sphère interne
  const rExternes = Math.max(rBordInterne + 80, (nExternes * ESPACEMENT) / (2 * Math.PI));
  const rBordExterne = rExternes + 46;
  const size = Math.round((rBordExterne + 80) * 2); // + marge pour les étiquettes
  return { rInternes, rBordInterne, rExternes, rBordExterne, size, centre: size / 2 };
}

function position(i: number, n: number, r: number, centre: number) {
  const angle = (-90 + (360 / Math.max(n, 1)) * i) * (Math.PI / 180);
  return { left: centre + r * Math.cos(angle), top: centre + r * Math.sin(angle) };
}

function Noeud({ p, x, y }: { p: CartoItem; x: number; y: number }) {
  return (
    <Link
      href={`/strategie/parties-prenantes/${p.id}`}
      style={{ left: x, top: y }}
      className="-translate-x-1/2 -translate-y-1/2 absolute flex w-32 items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-xs leading-tight shadow-soft transition-colors hover:border-primary hover:bg-muted"
      title={`${p.nom} · priorité ${PRIORITE_LABELS[p.priorite]}`}
    >
      <span
        className={`mt-0.5 size-2 shrink-0 self-start rounded-full ${DOT[p.priorite] ?? DOT[1]}`}
      />
      <span className="font-medium">{p.nom}</span>
    </Link>
  );
}

export function Cartographie({ societe, parties }: { societe: string; parties: CartoItem[] }) {
  const internes = parties.filter((p) => p.sphere === "interne");
  const externes = parties.filter((p) => p.sphere === "externe");

  if (parties.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune partie prenante. Ajoutez-en pour construire la cartographie.
      </p>
    );
  }

  const g = geometrie(internes.length, externes.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Conteneur scrollable si la carte dépasse (beaucoup de parties / petit écran) */}
      <div className="overflow-auto">
        <div className="relative mx-auto" style={{ width: g.size, height: g.size }}>
          {/* Sphère externe */}
          <div
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full border border-border border-dashed"
            style={{ width: g.rBordExterne * 2, height: g.rBordExterne * 2 }}
          />
          {/* Sphère interne (remplie) */}
          <div
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full border border-primary/30 border-dashed bg-primary/5"
            style={{ width: g.rBordInterne * 2, height: g.rBordInterne * 2 }}
          />

          {/* Étiquettes des sphères (placées sur les bords, sans nœud) */}
          <span
            className="-translate-x-1/2 absolute left-1/2 rounded-full bg-background px-2 font-medium text-primary text-xs"
            style={{ top: g.centre - g.rBordInterne - 9 }}
          >
            Sphère interne
          </span>
          <span
            className="-translate-x-1/2 absolute left-1/2 rounded-full bg-background px-2 text-muted-foreground text-xs"
            style={{ top: g.centre - g.rBordExterne - 9 }}
          >
            Sphère externe
          </span>

          {/* Centre : la société */}
          <div
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex flex-col items-center justify-center rounded-full bg-primary p-2 text-center text-primary-foreground"
            style={{ width: ORG_R * 2, height: ORG_R * 2 }}
          >
            <span className="font-semibold text-sm leading-tight">{societe}</span>
          </div>

          {/* Nœuds internes (dans la sphère interne) */}
          {internes.map((p, i) => {
            const { left, top } = position(i, internes.length, g.rInternes, g.centre);
            return <Noeud key={p.id} p={p} x={left} y={top} />;
          })}
          {/* Nœuds externes (dans l'anneau externe) */}
          {externes.map((p, i) => {
            const { left, top } = position(i, externes.length, g.rExternes, g.centre);
            return <Noeud key={p.id} p={p} x={left} y={top} />;
          })}
        </div>
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
