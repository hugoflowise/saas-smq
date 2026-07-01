import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ModuleTabs } from "@/components/module-tabs";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
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

  // Valeurs (les plus récentes d'abord) → dernière valeur + valeurs par mois + série.
  // NB : indicateurs_valeurs n'a PAS de colonne deleted_at → ne pas filtrer dessus.
  const { data: valeurs } = await supabase
    .from("indicateurs_valeurs")
    .select("indicateur_id, valeur, date_mesure")
    .eq("tenant_id", tid)
    .order("date_mesure", { ascending: false });

  const periodes = douzeDerniersMois();
  const periodeKeys = new Set(periodes.map((p) => p.cle));
  const lastByInd = new Map<string, { valeur: number; date: string }>();
  const parMoisByInd = new Map<string, Record<string, number>>();
  const serieByInd = new Map<string, { date: string; valeur: number }[]>();
  for (const v of valeurs ?? []) {
    const valeur = Number(v.valeur);
    if (!lastByInd.has(v.indicateur_id)) {
      lastByInd.set(v.indicateur_id, { valeur, date: v.date_mesure });
    }
    const mois = (v.date_mesure ?? "").slice(0, 7);
    if (periodeKeys.has(mois)) {
      const rec = parMoisByInd.get(v.indicateur_id) ?? {};
      // Valeurs triées desc : la première rencontrée pour un mois est la plus récente.
      if (rec[mois] === undefined) {
        rec[mois] = valeur;
        parMoisByInd.set(v.indicateur_id, rec);
      }
    }
    const serie = serieByInd.get(v.indicateur_id) ?? [];
    serie.push({ date: formatDate(v.date_mesure), valeur });
    serieByInd.set(v.indicateur_id, serie);
  }
  // Ordre chronologique pour les graphes (les valeurs ont été empilées en desc).
  for (const s of serieByInd.values()) s.reverse();

  // Objectifs qualité : tous (options de rattachement) + liens existants (§6.2/§9.1).
  const [{ data: liens }, { data: allObjectifs }] = await Promise.all([
    supabase.from("objectif_indicateurs").select("indicateur_id, objectif_id").eq("tenant_id", tid),
    supabase
      .from("objectifs_qualite")
      .select("id, intitule")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);
  const objectifOptions = (allObjectifs ?? []).map((o) => ({ id: o.id, intitule: o.intitule }));
  const objNomById = new Map(objectifOptions.map((o) => [o.id, o.intitule]));
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
    serie: serieByInd.get(ind.id) ?? [],
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
        <CreateIndicateurDialog
          processusOptions={processusOptions}
          objectifOptions={objectifOptions}
        />
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
