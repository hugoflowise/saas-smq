import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateProcedureDialog } from "@/app/(tenant)/documentation/procedures/create-procedure-dialog";
import { CreateIndicateurDialog } from "@/app/(tenant)/indicateurs/create-indicateur-dialog";
import { NcDialog } from "@/app/(tenant)/nc/nc-dialog";
import { RoDialog } from "@/app/(tenant)/risques/ro-dialog";
import { ObjectifDialog } from "@/app/(tenant)/strategie/objectifs/objectif-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { objectifProgress } from "@/lib/objectifs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { EditProcessusDialog } from "./edit-processus-dialog";

const TYPE_LABELS: Record<string, string> = {
  pilotage: "Pilotage",
  realisation: "Réalisation",
  support: "Support",
};

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

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
    .select(
      "id, nom, type, description, entrees, sorties, ressources_associees, date_derniere_revue, date_prochaine_revue",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();

  if (!processus) notFound();

  const [procedures, indicateurs, risques, ncs, objectifs, allProcessus] = await Promise.all([
    supabase
      .from("procedures")
      .select("id, titre, statut")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("titre"),
    supabase
      .from("indicateurs")
      .select("id, nom, unite, cible, seuil_alerte_min, seuil_alerte_max")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("nom"),
    supabase
      .from("risques_opportunites")
      .select("id, intitule, criticite, type")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("criticite", { ascending: false }),
    supabase
      .from("non_conformites")
      .select("id, reference, intitule, statut")
      .eq("tenant_id", tid)
      .eq("processus_concerne", id)
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
    supabase.from("processus").select("id, nom").eq("tenant_id", tid).order("ordre_affichage"),
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
  const roItems: RelatedItem[] = (risques.data ?? []).map((r) => ({
    id: r.id,
    href: "/risques",
    primary: r.intitule,
    secondary: `${r.type === "risque" ? "Risque" : "Opportunité"} · criticité ${r.criticite}`,
  }));
  const ncItems: RelatedItem[] = (ncs.data ?? []).map((n) => ({
    id: n.id,
    href: `/nc/${n.id}${from}`,
    primary: `${n.reference} · ${n.intitule}`,
    secondary: n.statut,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/processus"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Processus
      </Link>

      <PageHeader title={processus.nom}>
        <EditProcessusDialog processus={processus} />
      </PageHeader>
      <Badge variant="secondary" className="mb-6">
        {TYPE_LABELS[processus.type] ?? processus.type}
      </Badge>

      <Tabs defaultValue="apercu">
        <TabsList>
          <TabsTrigger value="apercu">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="objectifs">Objectifs ({objList.length})</TabsTrigger>
          <TabsTrigger value="procedures">Procédures ({procItems.length})</TabsTrigger>
          <TabsTrigger value="risques">R&O ({roItems.length})</TabsTrigger>
          <TabsTrigger value="nc">NC liées ({ncItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fiche d'identité</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Description" value={processus.description} />
              <Field label="Entrées" value={processus.entrees} />
              <Field label="Sorties" value={processus.sorties} />
              <Field label="Ressources associées" value={processus.ressources_associees} />
              <Field label="Dernière revue" value={formatDate(processus.date_derniere_revue)} />
              <Field label="Prochaine revue" value={formatDate(processus.date_prochaine_revue)} />
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Indicateurs ({indList.length})</h2>
              <CreateIndicateurDialog processusOptions={processusOptions} presetProcessusId={id} />
            </div>
            {indList.length === 0 ? (
              <EmptyState
                title="Aucun indicateur"
                description="Ajoutez un indicateur pour suivre la performance de ce processus."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {indList.map((ind) => {
                  const v = lastVal.get(ind.id);
                  const alert =
                    v !== undefined &&
                    ((ind.seuil_alerte_min !== null && v < ind.seuil_alerte_min) ||
                      (ind.seuil_alerte_max !== null && v > ind.seuil_alerte_max));
                  return (
                    <Link key={ind.id} href={`/indicateurs/${ind.id}${from}`}>
                      <Card className="h-full transition-colors hover:border-primary/40">
                        <CardHeader>
                          <CardTitle className="text-sm">{ind.nom}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-baseline gap-1">
                            <span className="font-semibold text-2xl">{v ?? "—"}</span>
                            {ind.unite ? (
                              <span className="text-muted-foreground text-sm">{ind.unite}</span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                            {ind.cible !== null ? <span>Cible : {ind.cible}</span> : null}
                            {alert ? (
                              <span className="rounded-full bg-status-nc-mineure/15 px-2 py-0.5 font-medium text-status-nc-mineure">
                                Hors seuil
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
                                {o.valeurEffective ?? "—"} / {o.valeur_cible} {o.unite ?? ""}
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
          <RelatedList
            items={roItems}
            empty="Aucun risque ni opportunité rattaché à ce processus."
          />
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
