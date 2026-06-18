import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CreateProcessusDialog } from "./create-processus-dialog";

const COLUMNS = [
  { type: "pilotage" as const, label: "Pilotage" },
  { type: "realisation" as const, label: "Réalisation" },
  { type: "support" as const, label: "Support" },
];

export default async function ProcessusPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader
          title="Cartographie des processus"
          description="Processus de pilotage, de réalisation et de support."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut de la page pour afficher sa cartographie."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom, type, description, date_prochaine_revue")
    .eq("tenant_id", ctx.effectiveTenantId)
    .order("ordre_affichage", { ascending: true });

  const items = processus ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const horizon60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  /** "retard" | "bientot" | null selon la prochaine revue. */
  function revueAlerte(date: string | null): "retard" | "bientot" | null {
    if (!date) return null;
    if (date < today) return "retard";
    if (date <= horizon60) return "bientot";
    return null;
  }
  const aReviser = items.filter((p) => revueAlerte(p.date_prochaine_revue) !== null).length;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Cartographie des processus"
        description="Processus de pilotage, de réalisation et de support."
        isoClause="ISO 9001 §4.4"
        help="Déterminez les processus du SMQ et leurs interactions : pilote, entrées/sorties, ressources, critères et indicateurs de performance (approche processus)."
      >
        <CreateProcessusDialog />
      </PageHeader>

      {aReviser > 0 ? (
        <div className="mb-4 rounded-lg border border-status-pa/40 bg-status-pa/10 px-4 py-2.5 text-sm text-status-pa">
          {aReviser} processus à réviser (revue échue ou prévue sous 60 jours).
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun processus"
          description="Créez votre premier processus pour démarrer la cartographie."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colItems = items.filter((p) => p.type === col.type);
            return (
              <Card key={col.type}>
                <CardHeader>
                  <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
                    {col.label}
                    <span className="ml-2 text-foreground">{colItems.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {colItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">—</p>
                  ) : (
                    colItems.map((p) => (
                      <Link
                        key={p.id}
                        href={`/processus/${p.id}`}
                        className="rounded-md border bg-surface px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{p.nom}</p>
                          {revueAlerte(p.date_prochaine_revue) === "retard" ? (
                            <span className="shrink-0 rounded-full bg-status-nc-mineure/15 px-2 py-0.5 font-medium text-[10px] text-status-nc-mineure">
                              Revue en retard
                            </span>
                          ) : revueAlerte(p.date_prochaine_revue) === "bientot" ? (
                            <span className="shrink-0 rounded-full bg-status-pa/15 px-2 py-0.5 font-medium text-[10px] text-status-pa">
                              À réviser
                            </span>
                          ) : null}
                        </div>
                        {p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                            {p.description}
                          </p>
                        ) : null}
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
