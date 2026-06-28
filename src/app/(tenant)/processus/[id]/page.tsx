import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateProcedureDialog } from "@/app/(tenant)/documentation/procedures/create-procedure-dialog";
import { CreateIndicateurDialog } from "@/app/(tenant)/indicateurs/create-indicateur-dialog";
import { NcDialog } from "@/app/(tenant)/nc/nc-dialog";
import { RoDialog } from "@/app/(tenant)/risques/ro-dialog";
import { RoTabList } from "@/app/(tenant)/risques/ro-tab-list";
import { ObjectifDialog } from "@/app/(tenant)/strategie/objectifs/objectif-dialog";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/empty-state";
import type { FicheProcessusData } from "@/components/fiche-processus";
import { PageHeader } from "@/components/page-header";
import { SupprimerButton } from "@/components/supprimer-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteProcessusAction } from "@/lib/actions/processus";
import { loadFicheProcessusData } from "@/lib/fiche-processus-data";
import { formatDate, nomPersonne } from "@/lib/format";
import { cibleAffichee, horsCible } from "@/lib/indicateurs";
import { objectifProgress } from "@/lib/objectifs";
import { canApprove, canWrite } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { FicheClient } from "./fiche-client";
import { FicheVersionHistory } from "./fiche-version-history";
import { TrigrammeEditor } from "./trigramme-editor";

const TYPE_LABELS: Record<string, string> = {
  pilotage: "Pilotage",
  realisation: "Réalisation",
  support: "Support",
};

type RelatedItem = { id: string; href: string; primary: string; secondary?: string };

function RelatedList({ items, empty }: { items: RelatedItem[]; empty: string }) {
  if (items.length === 0) {
    return <EmptyState title="Rien à afficher" description={empty} />;
  }
  return (
    <Card>
      <CardContent className="py-2">
        <ul className="flex flex-col divide-y">
          {items.map((it) => (
            <li key={it.id} className="py-2.5">
              <Link
                href={it.href}
                className="flex items-center justify-between gap-3 text-sm hover:text-primary"
              >
                <span className="min-w-0 truncate font-medium">{it.primary}</span>
                {it.secondary ? (
                  <span className="shrink-0 text-muted-foreground text-xs">{it.secondary}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default async function ProcessusDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx.effectiveTenantId) redirect("/processus");

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;
  const from = `?from=/processus/${id}`;

  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom, type, code, date_derniere_revue, date_prochaine_revue")
    .eq("id", id)
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .maybeSingle();

  if (!processus) notFound();

  const [procedures, indicateurs, risques, ncs, objectifs, allProcessus] = await Promise.all([
    supabase
      .from("procedures")
      .select("id, titre, statut")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .is("deleted_at", null)
      .order("titre"),
    supabase
      .from("indicateurs")
      .select(
        "id, nom, description, processus_id, type, unite, cible, sens, formule_calcul, frequence_mesure",
      )
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .is("deleted_at", null)
      .order("nom"),
    supabase
      .from("risques_opportunites")
      .select(
        "id, intitule, type, processus_id, cause, consequence, gravite, probabilite, criticite, gravite_residuelle, probabilite_residuelle, traitement_prevu, statut, date_revue",
      )
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .is("deleted_at", null)
      .order("criticite", { ascending: false }),
    supabase
      .from("non_conformites")
      .select("id, reference, intitule, statut")
      .eq("tenant_id", tid)
      .eq("processus_concerne", id)
      .is("deleted_at", null)
      .order("date_constat", { ascending: false }),
    supabase
      .from("objectifs_qualite")
      .select(
        "id, intitule, description, cible_chiffree, echeance, fonction_concernee, statut, valeur_cible, valeur_actuelle, unite, sens, processus_id, indicateur_id",
      )
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .is("deleted_at", null)
      .order("created_at"),
    supabase
      .from("processus")
      .select("id, nom, code")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("ordre_affichage"),
  ]);

  const indList = indicateurs.data ?? [];
  const indIds = indList.map((i) => i.id);
  const { data: valeurs } = indIds.length
    ? await supabase
        .from("indicateurs_valeurs")
        .select("indicateur_id, valeur, date_mesure")
        .in("indicateur_id", indIds)
        .order("date_mesure", { ascending: false })
    : { data: [] };
  const lastVal = new Map<string, number>();
  for (const v of valeurs ?? []) {
    if (!lastVal.has(v.indicateur_id)) lastVal.set(v.indicateur_id, v.valeur);
  }

  const processusOptions = allProcessus.data ?? [];
  const indicateurOptions = indList.map((i) => ({ id: i.id, nom: i.nom }));

  const objList = (objectifs.data ?? []).map((o) => {
    const valeurEffective =
      o.indicateur_id && lastVal.has(o.indicateur_id)
        ? (lastVal.get(o.indicateur_id) ?? null)
        : o.valeur_actuelle;
    return {
      ...o,
      valeurEffective,
      pct: objectifProgress(valeurEffective, o.valeur_cible, o.sens),
    };
  });

  const procItems: RelatedItem[] = (procedures.data ?? []).map((p) => ({
    id: p.id,
    href: `/documentation/procedures/${p.id}${from}`,
    primary: p.titre,
    secondary: p.statut,
  }));
  const roRows = risques.data ?? [];
  const ncItems: RelatedItem[] = (ncs.data ?? []).map((n) => ({
    id: n.id,
    href: `/nc/${n.id}${from}`,
    primary: `${n.reference} · ${n.intitule}`,
    secondary: n.statut,
  }));

  // Fiche d'identité : données assemblées par le chargeur partagé (cf. impression).
  const fiche = await loadFicheProcessusData(tid, id);

  // Historique des versions figées de la fiche (instantanés créés à la publication).
  const { data: versionsRaw } = await supabase
    .from("processus_fiche_versions")
    .select("id, version, approved_at, snapshot, redige_par, soumis_par, approved_by")
    .eq("processus_id", id)
    .eq("tenant_id", tid)
    .order("created_at", { ascending: false });
  const vPersonIds = [
    ...new Set(
      (versionsRaw ?? [])
        .flatMap((v) => [v.redige_par, v.soumis_par, v.approved_by])
        .filter(Boolean) as string[],
    ),
  ];
  const { data: vPersons } = vPersonIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", vPersonIds)
    : { data: [] };
  const vNameById = new Map((vPersons ?? []).map((p) => [p.id, nomPersonne(p.full_name, p.email)]));
  const ficheVersions = (versionsRaw ?? []).map((v) => ({
    id: v.id,
    version: v.version,
    approvedAt: v.approved_at,
    redacteur: v.redige_par ? (vNameById.get(v.redige_par) ?? null) : null,
    verificateur: v.soumis_par ? (vNameById.get(v.soumis_par) ?? null) : null,
    approbateur: v.approved_by ? (vNameById.get(v.approved_by) ?? null) : null,
    snapshot: v.snapshot as FicheProcessusData | null,
  }));
  // Version publiée actuelle non encore instantanée (publiée avant l'historique) :
  // on l'affiche depuis les données vivantes pour ne jamais « perdre » la version en vigueur.
  if (
    fiche?.statut === "publiee" &&
    fiche.data.version &&
    !ficheVersions.some((v) => v.version === fiche.data.version)
  ) {
    ficheVersions.unshift({
      id: "courante",
      version: fiche.data.version,
      approvedAt: fiche.data.versionDate,
      redacteur: fiche.data.redacteur,
      verificateur: fiche.data.verificateur,
      approbateur: fiche.data.approbateur,
      snapshot: fiche.data,
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <BackLink href="/processus" label="Processus" />

      <PageHeader title={processus.nom}>
        <SupprimerButton
          action={deleteProcessusAction}
          id={processus.id}
          libelle="ce processus"
          redirectTo="/processus"
        />
      </PageHeader>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Badge variant="secondary">{TYPE_LABELS[processus.type] ?? processus.type}</Badge>
        <span className="text-muted-foreground text-sm">
          Dernière revue : {formatDate(processus.date_derniere_revue)} · Prochaine :{" "}
          {formatDate(processus.date_prochaine_revue)}
        </span>
      </div>
      <div className="mb-6">
        <TrigrammeEditor id={processus.id} initial={processus.code ?? null} />
      </div>

      <Tabs defaultValue="fiche">
        <TabsList>
          <TabsTrigger value="fiche">Fiche d'identité</TabsTrigger>
          <TabsTrigger value="indicateurs">Indicateurs ({indList.length})</TabsTrigger>
          <TabsTrigger value="objectifs">Objectifs ({objList.length})</TabsTrigger>
          <TabsTrigger value="procedures">Procédures ({procItems.length})</TabsTrigger>
          <TabsTrigger value="risques">R&O ({roRows.length})</TabsTrigger>
          <TabsTrigger value="nc">NC liées ({ncItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="fiche">
          {fiche ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                <FicheClient
                  data={fiche.data}
                  initial={fiche.initial}
                  users={fiche.users}
                  statut={fiche.statut}
                  canWrite={canWrite(ctx.role)}
                  canApprove={canApprove(ctx.role)}
                  printHref={`/print/processus-fiche/${id}`}
                  indicateurs={indList}
                  risques={roRows}
                  processusOptions={processusOptions}
                />
              </div>
              <aside className="lg:sticky lg:top-4 lg:self-start">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historique des versions</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[70vh] overflow-y-auto">
                    <FicheVersionHistory
                      versions={ficheVersions}
                      pending={{ version: fiche.data.version ?? "", statut: fiche.statut }}
                    />
                  </CardContent>
                </Card>
              </aside>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="indicateurs" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <CreateIndicateurDialog processusOptions={processusOptions} presetProcessusId={id} />
          </div>
          <div>
            {indList.length === 0 ? (
              <EmptyState
                title="Aucun indicateur"
                description="Ajoutez un indicateur pour suivre la performance de ce processus."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {indList.map((ind) => {
                  const v = lastVal.get(ind.id);
                  const alert = v !== undefined && horsCible(v, ind.cible, ind.sens);
                  return (
                    <Link key={ind.id} href={`/indicateurs/${ind.id}${from}`}>
                      <Card className="h-full transition-colors hover:border-primary/40">
                        <CardHeader>
                          <CardTitle className="text-sm">{ind.nom}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-baseline gap-1">
                            <span className="font-semibold text-2xl">{v ?? "-"}</span>
                            {ind.unite ? (
                              <span className="text-muted-foreground text-sm">{ind.unite}</span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                            {ind.cible !== null ? (
                              <span>Cible : {cibleAffichee(ind.cible, ind.sens, ind.unite)}</span>
                            ) : null}
                            {alert ? (
                              <span className="rounded-full bg-status-nc-mineure/15 px-2 py-0.5 font-medium text-status-nc-mineure">
                                Hors cible
                              </span>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="objectifs" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <ObjectifDialog
              processusOptions={processusOptions}
              indicateurOptions={indicateurOptions}
              presetProcessusId={id}
            />
          </div>
          {objList.length === 0 ? (
            <EmptyState
              title="Aucun objectif"
              description="Rattachez un objectif qualité à ce processus pour suivre sa performance."
            />
          ) : (
            <Card>
              <CardContent className="py-2">
                <ul className="flex flex-col divide-y">
                  {objList.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <Link
                          href="/strategie/objectifs"
                          className="font-medium text-sm hover:text-primary"
                        >
                          {o.intitule}
                        </Link>
                        {o.indicateur_id ? (
                          <Link
                            href={`/indicateurs/${o.indicateur_id}${from}`}
                            className="block text-primary text-xs hover:underline"
                          >
                            ↳ Indicateur de mesure
                          </Link>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {o.valeur_cible !== null ? (
                          <div className="flex w-40 flex-col gap-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-muted-foreground">
                                {o.valeurEffective ?? "-"} / {o.valeur_cible} {o.unite ?? ""}
                              </span>
                              {o.pct !== null ? (
                                <span className="font-medium">{o.pct}%</span>
                              ) : null}
                            </div>
                            {o.pct !== null ? (
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${
                                    o.pct >= 100
                                      ? "bg-status-conforme"
                                      : o.pct >= 60
                                        ? "bg-status-pf"
                                        : o.pct >= 30
                                          ? "bg-status-pa"
                                          : "bg-status-nc-mineure"
                                  }`}
                                  style={{ width: `${o.pct}%` }}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-status-pa text-xs">À chiffrer</span>
                        )}
                        <ObjectifDialog
                          objectif={o}
                          processusOptions={processusOptions}
                          indicateurOptions={indicateurOptions}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="procedures" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <CreateProcedureDialog processusOptions={processusOptions} presetProcessusId={id} />
          </div>
          <RelatedList items={procItems} empty="Aucune procédure rattachée à ce processus." />
        </TabsContent>
        <TabsContent value="risques" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <RoDialog processusOptions={processusOptions} presetProcessusId={id} />
          </div>
          {roRows.length === 0 ? (
            <EmptyState
              title="Aucun risque ni opportunité"
              description="Aucun risque ni opportunité rattaché à ce processus."
            />
          ) : (
            <RoTabList rows={roRows} processusOptions={processusOptions} />
          )}
        </TabsContent>
        <TabsContent value="nc" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <NcDialog processusOptions={processusOptions} presetProcessusId={id} />
          </div>
          <RelatedList items={ncItems} empty="Aucune non-conformité rattachée à ce processus." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
