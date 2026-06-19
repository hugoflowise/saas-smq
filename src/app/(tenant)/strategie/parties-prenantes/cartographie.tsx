import Link from "next/link";
import { PRIORITE_CLASS } from "@/lib/parties-prenantes";

type CartoItem = { id: string; nom: string; sphere: string; priorite: number };

function Boite({ p, interne }: { p: CartoItem; interne: boolean }) {
  return (
    <Link
      href={`/strategie/parties-prenantes/${p.id}`}
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        interne
          ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
          : "border-border bg-card hover:bg-muted"
      }`}
    >
      <span className="min-w-0 truncate font-medium">{p.nom}</span>
      <span
        className={`size-2 shrink-0 rounded-full ${PRIORITE_CLASS[p.priorite]}`}
        title="Priorité"
      />
    </Link>
  );
}

export function Cartographie({ parties }: { parties: CartoItem[] }) {
  const internes = parties.filter((p) => p.sphere === "interne");
  const externes = parties.filter((p) => p.sphere === "externe");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Sphère interne · forte proximité
        </p>
        {internes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune partie prenante interne.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {internes.map((p) => (
              <Boite key={p.id} p={p} interne />
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Sphère externe · proximité faible à moyenne
        </p>
        {externes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune partie prenante externe.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {externes.map((p) => (
              <Boite key={p.id} p={p} interne={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
