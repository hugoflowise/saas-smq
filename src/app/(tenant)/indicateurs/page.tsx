import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { PERFORMANCE_TABS } from "@/lib/module-tabs";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { CreateIndicateurDialog } from "./create-indicateur-dialog";
import { type IndicateurSuivi, IndicateursExplorer } from "./indicateurs-explorer";

/** 12 derniers mois (du plus ancien au plus récent) : clés YYYY-MM + libellés courts. */
function douzeDerniersMois(): { cle: string; label: string }[] {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });
  const out: { cle: string; label: string }[] = [];
  for (let k = 11; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ cle, label: fmt.format(d) });
  }
  return out;
}

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
    .is("deleted_at", null)
    .order("ordre_affichage", { ascending: true });
  const processusOptions = processus ?? [];
  const processusNomById = new Map(processusOptions.map((p) => [p.id, p.nom]));

  const { data: indicateurs } = await supabase
    .from("indicateurs")
    .select("id, nom, unite, cible, sens, frequence_mesure, processus_id")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("nom", { ascending: true });
  const items = indicateurs ?? [];

  // Valeurs (les plus récentes d'abord) → dernière valeur + valeurs par mois.
  const { data: valeurs } = await supabase
    .from("indicateurs_valeurs")
    .select("indicateur_id, valeur, date_mesure")
    .eq("tenant_id", tid)
    .is("deleted_at", null)
    .order("date_mesure", { ascending: false });

  const periodes = douzeDerniersMois();
  const periodeKeys = new Set(periodes.map((p) => p.cle));
  const lastByInd = new Map<string, { valeur: number; date: string }>();
  const parMoisByInd = new Map<string, Record<string, number>>();
  for (const v of valeurs ?? []) {
    if (!lastByInd.has(v.indicateur_id)) {
      lastByInd.set(v.indicateur_id, { valeur: v.valeur, date: v.date_mesure });
    }
    const mois = (v.date_mesure ?? "").slice(0, 7);
    if (periodeKeys.has(mois)) {
      const rec = parMoisByInd.get(v.indicateur_id) ?? {};
      // Valeurs triées desc : la première rencontrée pour un mois est la plus récente.
      if (rec[mois] === undefined) {
        rec[mois] = v.valeur;
        parMoisByInd.set(v.indicateur_id, rec);
      }
    }
  }

  // Objectif(s) rattaché(s) à chaque indicateur (§6.2/§9.1).
  const { data: liens } = await supabase
    .from("objectif_indicateurs")
    .select("indicateur_id, objectif_id")
    .eq("tenant_id", tid);
  const objIds = [...new Set((liens ?? []).map((l) => l.objectif_id))];
  const objNomById = new Map<string, string>();
  if (objIds.length) {
    const { data: objs } = await supabase
      .from("objectifs_qualite")
      .select("id, intitule")
      .in("id", objIds);
    for (const o of objs ?? []) objNomById.set(o.id, o.intitule);
  }
  const objectifsByInd = new Map<string, string[]>();
  for (const l of liens ?? []) {
    const nom = objNomById.get(l.objectif_id);
    if (!nom) continue;
    const list = objectifsByInd.get(l.indicateur_id) ?? [];
    list.push(nom);
    objectifsByInd.set(l.indicateur_id, list);
  }
  const lieAObjectif = new Set((liens ?? []).map((l) => l.indicateur_id));

  const suivi: IndicateurSuivi[] = items.map((ind) => ({
    id: ind.id,
    nom: ind.nom,
    unite: ind.unite,
    cible: ind.cible,
    sens: ind.sens,
    processusNom: ind.processus_id ? (processusNomById.get(ind.processus_id) ?? null) : null,
    objectifs: objectifsByInd.get(ind.id) ?? [],
    last: lastByInd.get(ind.id) ?? null,
    valeursParPeriode: parMoisByInd.get(ind.id) ?? {},
    lieAObjectif: lieAObjectif.has(ind.id),
  }));

  const sansObjectif = items.filter((i) => !lieAObjectif.has(i.id)).length;

  return (
    <div className="w-full">
      <ModuleTabs tabs={PERFORMANCE_TABS} />
      <PageHeader
        title="Indicateurs / KPI"
        description="Tableau de bord des indicateurs de performance."
        isoClause="ISO 9001 §9.1.1"
        help="Surveillance et mesure : déterminez quoi mesurer, par quelles méthodes et à quelle fréquence, puis analysez les résultats au regard des objectifs. Le tableau montre l'évolution des 12 derniers mois ; cliquez un indicateur pour son graphe détaillé."
      >
        <CreateIndicateurDialog processusOptions={processusOptions} />
      </PageHeader>

      {sansObjectif > 0 ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-status-pa/40 bg-status-pa/5 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-pa" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {sansObjectif} indicateur{sansObjectif > 1 ? "s" : ""} non rattaché
              {sansObjectif > 1 ? "s" : ""} à un objectif
            </span>
            <span className="text-muted-foreground">
              Un indicateur mesure normalement l'atteinte d'un objectif qualité. Rattachez-le depuis
              Pilotage → Objectifs (un objectif peut s'appuyer sur plusieurs indicateurs).
            </span>
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun indicateur"
          description="Créez un indicateur puis saisissez ses valeurs au fil du temps."
        />
      ) : (
        <IndicateursExplorer indicateurs={suivi} periodes={periodes} />
      )}
    </div>
  );
}
