import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cibleAffichee, horsCible } from "@/lib/indicateurs";
import { PERFORMANCE_TABS } from "@/lib/module-tabs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CreateIndicateurDialog } from "./create-indicateur-dialog";

export default async function IndicateursPage() {
  const ctx = await getTenantContext();

  if (!ctx.effectiveTenantId) {
    return (
      <div className="w-full">
        <PageHeader
          title="Indicateurs / KPI"
          description="Tableau de bord des indicateurs de performance."
        />
        <EmptyState
          title="Aucun client sélectionné"
          description="Choisissez un client dans le sélecteur en haut pour afficher ses indicateurs."
        />
      </div>
    );
  }

  const supabase = await createClient();
  const tid = ctx.effectiveTenantId;

  const { data: processus } = await supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", tid)
    .order("ordre_affichage", { ascending: true });

  const { data: indicateurs } = await supabase
    .from("indicateurs")
    .select("id, nom, unite, cible, sens, frequence_mesure")
    .eq("tenant_id", tid)
    .order("nom", { ascending: true });

  // Dernière valeur de chaque indicateur
  const { data: valeurs } = await supabase
    .from("indicateurs_valeurs")
    .select("indicateur_id, valeur, date_mesure")
    .eq("tenant_id", tid)
    .order("date_mesure", { ascending: false });
  const lastByIndicateur = new Map<string, { valeur: number; date: string }>();
  for (const v of valeurs ?? []) {
    if (!lastByIndicateur.has(v.indicateur_id)) {
      lastByIndicateur.set(v.indicateur_id, { valeur: v.valeur, date: v.date_mesure });
    }
  }

  const items = indicateurs ?? [];

  return (
    <div className="w-full">
      <ModuleTabs tabs={PERFORMANCE_TABS} />
      <PageHeader
        title="Indicateurs / KPI"
        description="Tableau de bord des indicateurs de performance."
        isoClause="ISO 9001 §9.1.1"
        help="Surveillance et mesure : déterminez quoi mesurer, par quelles méthodes et à quelle fréquence, puis analysez les résultats au regard des objectifs."
      >
        <CreateIndicateurDialog processusOptions={processus ?? []} />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun indicateur"
          description="Créez un indicateur puis saisissez ses valeurs au fil du temps."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ind) => {
            const last = lastByIndicateur.get(ind.id);
            const alert = last && horsCible(last.valeur, ind.cible, ind.sens);
            return (
              <Link key={ind.id} href={`/indicateurs/${ind.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader>
                    <CardTitle className="text-sm">{ind.nom}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-2xl">{last ? last.valeur : "-"}</span>
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
  );
}
