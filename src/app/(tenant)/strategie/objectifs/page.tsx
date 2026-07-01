import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { EmptyState } from "@/components/empty-state";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { ProcessusLink } from "@/components/processus-link";
import { SupprimerButton } from "@/components/supprimer-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteObjectifAction } from "@/lib/actions/registres";
import { PERFORMANCE_TABS } from "@/lib/module-tabs";
import { getNormesActives } from "@/lib/normes-actives";
import { domaineLabel, objectifsLabel } from "@/lib/normes-libelles";
import { chargerMesuresObjectifs, mesureVide } from "@/lib/objectifs-mesure";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { ObjEcheanceCell, ObjStatutCell } from "./inline-cells";
import { ObjectifActions } from "./objectif-actions";
import { ObjectifDialog } from "./objectif-dialog";

function progressClass(pct: number) {
  if (pct >= 100) return "bg-status-conforme";
  if (pct >= 60) return "bg-status-pf";
  if (pct >= 30) return "bg-status-pa";
  return "bg-status-nc-mineure";
}

export default async function ObjectifsPage() {
  const ctx = await getTenantContext();
  const normes = await getNormesActives();
  const objTitre = objectifsLabel(normes);
  const domaine = domaineLabel(normes);
  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title={objTitre}
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

  const [{ data: objectifs }, { data: processus }, { data: indicateurs }] = await Promise.all([
    supabase
      .from("objectifs_qualite")
      .select(
        "id, intitule, description, cible_chiffree, echeance, fonction_concernee, statut, valeur_cible, valeur_actuelle, unite, sens, processus_id, indicateur_id, engagement_id, valide_par, valide_le",
      )
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("processus")
      .select("id, nom")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("ordre_affichage", { ascending: true }),
    supabase
      .from("indicateurs")
      .select("id, nom, unite, cible, sens")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("nom", { ascending: true }),
  ]);

  const items = objectifs ?? [];
  const processusOptions = processus ?? [];
  const indicateurOptions = indicateurs ?? [];

  // Engagements de la politique qualité (§6.2), pour la matrice de couverture.
  const { data: engagements } = await supabase
    .from("politique_engagements")
    .select("id, libelle")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("ordre", { ascending: true });
  const engagementOptions = engagements ?? [];
  const engagementById = new Map(engagementOptions.map((e) => [e.id, e.libelle]));

  // Mesure de chaque objectif via ses indicateurs liés (source unique partagée
  // avec le dashboard, la fiche processus et la revue de direction).
  const objIds = items.map((o) => o.id);
  const mesures = await chargerMesuresObjectifs(supabase, tid, objIds);
  const withProgress = items.map((o) => {
    const m = mesures.get(o.id) ?? mesureVide();
    // Atteint si la direction l'a acté, ou si tous ses indicateurs atteignent leur cible.
    const atteint = o.statut === "atteint" || m.indicateursAtteints;
    return {
      ...o,
      indicateursLies: m.indicateurs,
      linkedIds: m.indicateurs.map((i) => i.id),
      pctMoyen: m.pctMoyen,
      atteint,
    };
  });
  const total = withProgress.length;
  const atteints = withProgress.filter((o) => o.atteint).length;
  const tauxGlobal = total > 0 ? Math.round((atteints / total) * 100) : 0;

  // Détection d'orphelins (intégrité relationnelle, recommandée et non bloquante).
  const sansProcessus = withProgress.filter((o) => !o.processus_id).length;
  const sansIndicateur = withProgress.filter((o) => o.indicateursLies.length === 0).length;

  // §6.2.2 : actions de mise en œuvre rattachées aux objectifs.
  const actionsByObjectif = new Map<
    string,
    { id: string; reference: string; description_courte: string; statut: string }[]
  >();
  if (objIds.length) {
    const { data: linkedActions } = await supabase
      .from("actions")
      .select("id, reference, description_courte, statut, objectif_id")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .in("objectif_id", objIds)
      .order("created_at", { ascending: true });
    for (const a of linkedActions ?? []) {
      if (!a.objectif_id) continue;
      const list = actionsByObjectif.get(a.objectif_id) ?? [];
      list.push({
        id: a.id,
        reference: a.reference,
        description_courte: a.description_courte,
        statut: a.statut,
      });
      actionsByObjectif.set(a.objectif_id, list);
    }
  }

  // Nom des validateurs (preuve d'établissement par la direction).
  const valideurIds = [...new Set(items.map((o) => o.valide_par).filter(Boolean))] as string[];
  const valideurNom = new Map<string, string>();
  if (valideurIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", valideurIds);
    for (const p of profs ?? []) valideurNom.set(p.id, p.full_name ?? "");
  }

  // Seule la direction (dirigeant / admin) peut établir un objectif.
  const canApprove = ctx.role === "admin_flowise" || ctx.role === "dirigeant";

  // Regroupement par processus (dans l'ordre d'affichage), orphelins en dernier.
  type ObjItem = (typeof withProgress)[number];
  const groupes: { id: string | null; nom: string; objs: ObjItem[] }[] = [];
  for (const p of processusOptions) {
    const objs = withProgress.filter((o) => o.processus_id === p.id);
    if (objs.length) groupes.push({ id: p.id, nom: p.nom, objs });
  }
  const orphelins = withProgress.filter((o) => !o.processus_id);

  return (
    <div className="w-full">
      <ModuleTabs tabs={PERFORMANCE_TABS} />
      <PageHeader
        title={objTitre}
        description="Objectifs SMART et leur déclinaison par fonction."
        concept="objectifs"
        help={`Les objectifs ${domaine} doivent être mesurables, cohérents avec la politique, suivis et mis à jour. Visez des objectifs SMART, déclinés par processus, faits par les pilotes et validés par la direction.`}
      >
        <ObjectifDialog
          processusOptions={processusOptions}
          indicateurOptions={indicateurOptions}
          engagementOptions={engagementOptions}
        />
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

      {/* Intégrité relationnelle : signale (sans bloquer) les objectifs non
          rattachés à un processus ou sans indicateur de mesure. */}
      {sansProcessus > 0 || sansIndicateur > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-status-pa/40 bg-status-pa/5 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-pa" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">À rattacher pour une traçabilité complète</span>
            <span className="text-muted-foreground">
              {sansProcessus > 0 ? (
                <>
                  {sansProcessus} objectif{sansProcessus > 1 ? "s" : ""} sans processus
                  {sansIndicateur > 0 ? " · " : ""}
                </>
              ) : null}
              {sansIndicateur > 0 ? (
                <>
                  {sansIndicateur} objectif{sansIndicateur > 1 ? "s" : ""} sans indicateur de mesure
                </>
              ) : null}
              . Ouvrez l'objectif pour le rattacher à son processus et à ses indicateurs.
            </span>
          </div>
        </div>
      ) : null}

      {total === 0 ? (
        <EmptyState
          title="Aucun objectif"
          description="Définissez les objectifs qualité (SMART) alignés sur la politique."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {[...groupes, ...(orphelins.length ? [{ id: null, nom: "", objs: orphelins }] : [])].map(
            (g) => (
              <section key={g.id ?? "orphelins"}>
                <h2 className="mb-2 flex items-center gap-2 font-medium text-sm">
                  {g.id ? (
                    <ProcessusLink id={g.id} nom={g.nom} />
                  ) : (
                    <span className="flex items-center gap-1.5 text-status-pa">
                      <AlertTriangle className="size-3.5" />
                      Non rattachés à un processus
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">({g.objs.length})</span>
                </h2>
                <div className="rounded-2xl border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Objectif</TableHead>
                        <TableHead className="w-[44%]">Indicateurs & mesure</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.objs.map((o) => (
                        <Fragment key={o.id}>
                          <TableRow>
                            <TableCell className="font-medium align-top">
                              {o.intitule}
                              {o.engagement_id && engagementById.has(o.engagement_id) ? (
                                <span className="mt-0.5 block text-xs text-primary">
                                  ↳ Engagement : {engagementById.get(o.engagement_id)}
                                </span>
                              ) : null}
                              {o.pctMoyen !== null ? (
                                <span className="mt-0.5 block text-muted-foreground text-xs">
                                  Progression globale : {o.pctMoyen}%
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="align-top">
                              {o.indicateursLies.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {o.indicateursLies.map((ind) => (
                                    <div key={ind.id} className="flex flex-col gap-0.5">
                                      <div className="flex items-center justify-between gap-2 text-xs">
                                        <Link
                                          href={`/indicateurs/${ind.id}?from=/strategie/objectifs`}
                                          className="text-primary hover:underline"
                                        >
                                          {ind.nom}
                                        </Link>
                                        <span className="flex shrink-0 items-center gap-1.5">
                                          <span
                                            className={
                                              ind.atteint
                                                ? "font-medium text-status-conforme"
                                                : "font-medium"
                                            }
                                          >
                                            {ind.derniere ?? "-"}
                                            {ind.unite ? ` ${ind.unite}` : ""}
                                          </span>
                                          {ind.cible !== null ? (
                                            <span className="text-muted-foreground">
                                              / {ind.cible}
                                              {ind.unite ? ` ${ind.unite}` : ""}
                                            </span>
                                          ) : null}
                                          {ind.pct !== null ? (
                                            <span className="font-medium">{ind.pct}%</span>
                                          ) : null}
                                        </span>
                                      </div>
                                      {ind.pct !== null ? (
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                          <div
                                            className={`h-full rounded-full ${progressClass(ind.pct)}`}
                                            style={{ width: `${ind.pct}%` }}
                                          />
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">
                                          Pas encore de valeur mesurée
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="block text-status-pa text-xs">
                                  Aucun indicateur de mesure · ouvrez l'objectif pour en rattacher
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <ObjEcheanceCell id={o.id} value={o.echeance} />
                            </TableCell>
                            <TableCell>
                              <ObjStatutCell id={o.id} value={o.statut} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <ObjectifDialog
                                  objectif={o}
                                  processusOptions={processusOptions}
                                  indicateurOptions={indicateurOptions}
                                  engagementOptions={engagementOptions}
                                  linkedIndicateurIds={o.linkedIds}
                                />
                                <SupprimerButton
                                  action={deleteObjectifAction}
                                  id={o.id}
                                  libelle={`l'objectif « ${o.intitule} »`}
                                  iconOnly
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow className="border-b-0 hover:bg-transparent">
                            <TableCell colSpan={5} className="bg-muted/20 pt-0">
                              <ObjectifActions
                                objectifId={o.id}
                                linked={actionsByObjectif.get(o.id) ?? []}
                                valideLe={o.valide_le}
                                valideurNom={
                                  o.valide_par ? (valideurNom.get(o.valide_par) ?? null) : null
                                }
                                canApprove={canApprove}
                              />
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
