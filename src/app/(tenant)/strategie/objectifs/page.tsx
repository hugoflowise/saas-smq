import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { objectifProgress } from "@/lib/objectifs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ObjEcheanceCell, ObjStatutCell, ObjValeurActuelleCell } from "./inline-cells";
import { ObjectifDialog } from "./objectif-dialog";

function progressClass(pct: number) {
  if (pct >= 100) return "bg-status-conforme";
  if (pct >= 60) return "bg-status-pf";
  if (pct >= 30) return "bg-status-pa";
  return "bg-status-nc-mineure";
}

export default async function ObjectifsPage() {
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Objectifs qualité"
          description="Objectifs SMART et leur déclinaison par fonction."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const [{ data: objectifs }, { data: processus }] = await Promise.all([
    supabase
      .from("objectifs_qualite")
      .select(
        "id, intitule, description, cible_chiffree, echeance, fonction_concernee, statut, valeur_cible, valeur_actuelle, unite, sens, processus_id",
      )
      .eq("tenant_id", tid)
      .order("created_at", { ascending: true }),
    supabase
      .from("processus")
      .select("id, nom")
      .eq("tenant_id", tid)
      .order("ordre_affichage", { ascending: true }),
  ]);

  const items = objectifs ?? [];
  const processusOptions = processus ?? [];
  const processusNom = new Map(processusOptions.map((p) => [p.id, p.nom]));

  const withProgress = items.map((o) => {
    const pct = objectifProgress(o.valeur_actuelle, o.valeur_cible, o.sens);
    const atteint = o.statut === "atteint" || (pct !== null && pct >= 100);
    return { ...o, pct, atteint };
  });
  const total = withProgress.length;
  const atteints = withProgress.filter((o) => o.atteint).length;
  const tauxGlobal = total > 0 ? Math.round((atteints / total) * 100) : 0;

  return (
    <div className="w-full">
      <PageHeader
        title="Objectifs qualité"
        description="Objectifs SMART et leur déclinaison par fonction."
        isoClause="ISO 9001 §6.2"
        help="Les objectifs qualité doivent être mesurables, cohérents avec la politique, suivis et mis à jour. Visez des objectifs SMART, déclinés par processus, faits par les pilotes et validés par la direction."
      >
        <ObjectifDialog processusOptions={processusOptions} />
      </PageHeader>

      {total > 0 ? (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-6 py-5">
            <div>
              <p className="font-semibold text-3xl text-status-conforme">{tauxGlobal}%</p>
              <p className="text-muted-foreground text-xs">objectifs atteints</p>
            </div>
            <div className="flex gap-6 text-sm">
              <span>
                <span className="font-semibold">{total}</span>{" "}
                <span className="text-muted-foreground">au total</span>
              </span>
              <span>
                <span className="font-semibold text-status-conforme">{atteints}</span>{" "}
                <span className="text-muted-foreground">atteints</span>
              </span>
              <span>
                <span className="font-semibold">{total - atteints}</span>{" "}
                <span className="text-muted-foreground">en cours</span>
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {total === 0 ? (
        <EmptyState
          title="Aucun objectif"
          description="Définissez les objectifs qualité (SMART) alignés sur la politique."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objectif</TableHead>
                <TableHead>Processus</TableHead>
                <TableHead className="w-56">Progression</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {withProgress.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.intitule}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {o.processus_id ? (processusNom.get(o.processus_id) ?? "—") : "—"}
                  </TableCell>
                  <TableCell>
                    {o.valeur_cible !== null ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1">
                            <ObjValeurActuelleCell
                              id={o.id}
                              value={o.valeur_actuelle}
                              unite={o.unite}
                            />
                            <span className="text-muted-foreground">
                              / {o.valeur_cible} {o.unite ?? ""}
                            </span>
                          </span>
                          {o.pct !== null ? <span className="font-medium">{o.pct}%</span> : null}
                        </div>
                        {o.pct !== null ? (
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${progressClass(o.pct)}`}
                              style={{ width: `${o.pct}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 text-xs">
                        {o.cible_chiffree ? (
                          <span className="text-muted-foreground">Cible : {o.cible_chiffree}</span>
                        ) : null}
                        <span className="text-status-pa">
                          À chiffrer — ouvrez l'objectif pour définir la cible
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <ObjEcheanceCell id={o.id} value={o.echeance} />
                  </TableCell>
                  <TableCell>
                    <ObjStatutCell id={o.id} value={o.statut} />
                  </TableCell>
                  <TableCell>
                    <ObjectifDialog objectif={o} processusOptions={processusOptions} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
