import { horsCible } from "@/lib/indicateurs";
import { computeNps } from "@/lib/nps";
import { chargerMesuresObjectifs } from "@/lib/objectifs-mesure";
import type { createClient } from "@/lib/supabase/server";

/**
 * Données de performance du SMQ agrégées pour la revue de direction (§9.3.2 c).
 * Reprend les mêmes calculs que le tableau de bord, figés au moment de la revue.
 */
export type RevuePerformance = {
  conformiteIso: number | null;
  npsGlobal: number | null;
  satisfactionMoyenne: number | null;
  eNps: number | null;
  satisfactionCollaborateur: number | null;
  tauxObjectifs: number | null;
  objectifsTotal: number;
  objectifsAtteints: number;
  ncTotalAnnee: number;
  ncClotureesAnnee: number;
  ncOuvertes: number;
  reclamationsOuvertes: number;
  auditsRealisesAnnee: number;
  auditsTotalAnnee: number;
  roCritiques: number;
  indicateursTotal: number;
  indicateursHorsCible: number;
  fournisseursAReevaluer: number;
  fournisseursNoteMoyenne: number | null;
};

const NC_OUVERTES = ["ouverte", "analysee", "action_definie"] as const;

/** Cellules « label / valeur » du bloc performance, partagées écran + PDF. */
export function revuePerfCells(perf: RevuePerformance): { label: string; value: string }[] {
  // == null : tolère les anciens instantanés sans les nouveaux champs.
  return [
    { label: "Conformité ISO", value: perf.conformiteIso == null ? "-" : `${perf.conformiteIso}%` },
    { label: "NPS client", value: perf.npsGlobal == null ? "-" : String(perf.npsGlobal) },
    {
      label: "Satisfaction client /10",
      value: perf.satisfactionMoyenne == null ? "-" : String(perf.satisfactionMoyenne),
    },
    { label: "eNPS collaborateur", value: perf.eNps == null ? "-" : String(perf.eNps) },
    {
      label: "Satisfaction collab. /10",
      value: perf.satisfactionCollaborateur == null ? "-" : String(perf.satisfactionCollaborateur),
    },
    {
      label: "Objectifs atteints",
      value:
        perf.tauxObjectifs == null
          ? "-"
          : `${perf.tauxObjectifs}% (${perf.objectifsAtteints}/${perf.objectifsTotal})`,
    },
    {
      label: "NC de l'année",
      value: `${perf.ncTotalAnnee} (${perf.ncClotureesAnnee} clôturées)`,
    },
    { label: "NC ouvertes", value: String(perf.ncOuvertes) },
    { label: "Réclamations ouvertes", value: String(perf.reclamationsOuvertes) },
    { label: "Audits réalisés", value: `${perf.auditsRealisesAnnee}/${perf.auditsTotalAnnee}` },
    { label: "Risques critiques", value: String(perf.roCritiques) },
    {
      label: "Indicateurs hors cible",
      value: `${perf.indicateursHorsCible}/${perf.indicateursTotal}`,
    },
    {
      label: "Fournisseurs (note moy.)",
      value: perf.fournisseursNoteMoyenne == null ? "-" : `${perf.fournisseursNoteMoyenne}/5`,
    },
    { label: "Fournisseurs à réévaluer", value: String(perf.fournisseursAReevaluer) },
  ];
}

/**
 * Calcule les KPIs de performance pour une année donnée.
 * Les compteurs « ouverts » reflètent l'état courant ; les volumes NC/audits
 * sont cadrés sur l'année de la revue.
 */
export async function computeRevuePerformance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  annee: number,
): Promise<RevuePerformance> {
  const debut = `${annee}-01-01`;
  const fin = `${annee}-12-31`;

  const [
    refTotalRes,
    evalsRes,
    enquetesRes,
    objectifsRes,
    indicateursRes,
    valeursRes,
    ncAnneeRes,
    ncClotureesRes,
    ncOuvertesRes,
    reclamationsRes,
    auditsTotalRes,
    auditsRealisesRes,
    roCritiquesRes,
    fournisseursRes,
    suivisRes,
  ] = await Promise.all([
    supabase.from("referentiel_iso").select("id", { count: "exact", head: true }),
    supabase.from("conformite_evaluation").select("cotation").eq("tenant_id", tenantId),
    supabase
      .from("enquetes_satisfaction")
      .select("note_recommandation, note_satisfaction")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("objectifs_qualite")
      .select("id, statut")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("indicateurs")
      .select("id, cible, cible_texte, sens")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("indicateurs_valeurs")
      .select("indicateur_id, valeur, date_mesure")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("date_mesure", { ascending: false }),
    supabase
      .from("non_conformites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("date_constat", debut)
      .lte("date_constat", fin),
    supabase
      .from("non_conformites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("date_constat", debut)
      .lte("date_constat", fin)
      .in("statut", ["cloturee", "efficace", "inefficace"]),
    supabase
      .from("non_conformites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .in("statut", [...NC_OUVERTES]),
    supabase
      .from("reclamations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("statut", "cloturee"),
    supabase
      .from("audits_internes")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("date_prevue", debut)
      .lte("date_prevue", fin),
    supabase
      .from("audits_internes")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .not("date_realisee", "is", null)
      .gte("date_realisee", debut)
      .lte("date_realisee", fin),
    supabase
      .from("risques_opportunites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("type", "risque")
      .gt("criticite", 15),
    supabase
      .from("fournisseurs")
      .select("note_evaluation, prochaine_evaluation")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("suivis_consultant")
      .select("nps, satisfaction_globale")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
  ]);

  // Conformité ISO (% conforme + point fort)
  const refTotal = refTotalRes.count ?? 0;
  const conformes = (evalsRes.data ?? []).filter(
    (e) => e.cotation === "conforme" || e.cotation === "point_fort",
  ).length;
  const conformiteIso = refTotal > 0 ? Math.round((conformes / refTotal) * 100) : null;

  // Satisfaction : NPS + note moyenne /10
  const enquetes = enquetesRes.data ?? [];
  const { nps } = computeNps(enquetes.map((e) => e.note_recommandation));
  const notes = enquetes
    .map((e) => e.note_satisfaction)
    .filter((n): n is number => n !== null && n !== undefined);
  const satisfactionMoyenne =
    notes.length > 0
      ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
      : null;

  // Dernière valeur par indicateur (sert objectifs liés + hors cible)
  const lastVal = new Map<string, number>();
  for (const v of valeursRes.data ?? []) {
    if (!lastVal.has(v.indicateur_id)) lastVal.set(v.indicateur_id, Number(v.valeur));
  }
  const indicateurs = indicateursRes.data ?? [];
  const indicateursHorsCible = indicateurs.filter((i) => {
    const v = lastVal.get(i.id);
    return v !== undefined && horsCible(v, i.cible, i.sens, i.cible_texte);
  }).length;

  // Objectifs qualité (taux d'atteinte, piloté par les indicateurs liés)
  const objectifs = (objectifsRes.data ?? []).filter((o) => o.statut !== "abandonne");
  const objMesures = await chargerMesuresObjectifs(
    supabase,
    tenantId,
    objectifs.map((o) => o.id),
  );
  const objectifsAtteints = objectifs.filter(
    (o) => o.statut === "atteint" || (objMesures.get(o.id)?.indicateursAtteints ?? false),
  ).length;
  const tauxObjectifs =
    objectifs.length > 0 ? Math.round((objectifsAtteints / objectifs.length) * 100) : null;

  // Fournisseurs : note moyenne + nombre à réévaluer
  const fournisseurs = fournisseursRes.data ?? [];
  const fournNotes = fournisseurs
    .map((f) => f.note_evaluation)
    .filter((n): n is number => n !== null && n !== undefined);
  const fournisseursNoteMoyenne =
    fournNotes.length > 0
      ? Math.round((fournNotes.reduce((a, b) => a + b, 0) / fournNotes.length) * 10) / 10
      : null;
  const fournisseursAReevaluer = fournisseurs.filter(
    (f) => f.prochaine_evaluation !== null && (f.prochaine_evaluation as string) <= fin,
  ).length;

  // Écoute collaborateur : eNPS + satisfaction (suivi consultant)
  const suivis = suivisRes.data ?? [];
  const { nps: eNps } = computeNps(suivis.map((s) => s.nps));
  const satCollab = suivis
    .map((s) => s.satisfaction_globale)
    .filter((n): n is number => n !== null && n !== undefined);
  const satisfactionCollaborateur =
    satCollab.length > 0
      ? Math.round((satCollab.reduce((a, b) => a + b, 0) / satCollab.length) * 10) / 10
      : null;

  return {
    conformiteIso,
    npsGlobal: nps,
    satisfactionMoyenne,
    eNps,
    satisfactionCollaborateur,
    tauxObjectifs,
    objectifsTotal: objectifs.length,
    objectifsAtteints,
    ncTotalAnnee: ncAnneeRes.count ?? 0,
    ncClotureesAnnee: ncClotureesRes.count ?? 0,
    ncOuvertes: ncOuvertesRes.count ?? 0,
    reclamationsOuvertes: reclamationsRes.count ?? 0,
    auditsRealisesAnnee: auditsRealisesRes.count ?? 0,
    auditsTotalAnnee: auditsTotalRes.count ?? 0,
    roCritiques: roCritiquesRes.count ?? 0,
    indicateursTotal: indicateurs.length,
    indicateursHorsCible,
    fournisseursAReevaluer,
    fournisseursNoteMoyenne,
  };
}

/**
 * Données d'aide à la saisie des éléments d'entrée de la revue (§9.3.2).
 * Ces listes sont calculées en direct (jamais figées) : elles servent à montrer
 * que les entrées obligatoires sont couvertes et à pré-remplir les champs vides.
 * - (a) actions décidées lors des revues de direction antérieures + leur état ;
 * - (e) risques & opportunités critiques du client (efficacité des actions R&O).
 */
export type RevueEntreeAction = {
  id: string;
  reference: string;
  description: string;
  statut: string;
  revueAnnee: number;
};

export type RevueRoCritique = {
  id: string;
  intitule: string;
  criticite: number | null;
  criticiteResiduelle: number | null;
  statut: string;
};

export type RevueEntreesPrefill = {
  actionsAnterieures: RevueEntreeAction[];
  roCritiques: RevueRoCritique[];
};

/** Seuil de criticité au-delà duquel un risque est considéré comme critique. */
export const RO_CRITICITE_SEUIL = 15;

export async function computeRevueEntreesPrefill(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  annee: number,
  revueId: string,
): Promise<RevueEntreesPrefill> {
  // Revues de direction antérieures (années précédentes ou même année, hors revue
  // courante) : on récupère leur année pour situer les actions décidées.
  const { data: revuesAnterieures } = await supabase
    .from("revues_direction")
    .select("id, annee")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .neq("id", revueId)
    .lte("annee", annee);

  const anneeParRevue = new Map<string, number>(
    (revuesAnterieures ?? []).map((r) => [r.id, r.annee]),
  );
  const idsAnterieures = [...anneeParRevue.keys()];

  const [actionsRes, roRes] = await Promise.all([
    idsAnterieures.length > 0
      ? supabase
          .from("actions")
          .select("id, reference, description_courte, statut, revue_id")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .in("revue_id", idsAnterieures)
          .order("date_creation", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("risques_opportunites")
      .select("id, intitule, criticite, criticite_residuelle, statut")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .eq("type", "risque")
      .gt("criticite", RO_CRITICITE_SEUIL)
      .order("criticite", { ascending: false }),
  ]);

  const actionsAnterieures: RevueEntreeAction[] = (actionsRes.data ?? []).map((a) => ({
    id: a.id,
    reference: a.reference,
    description: a.description_courte,
    statut: a.statut,
    revueAnnee: a.revue_id ? (anneeParRevue.get(a.revue_id) ?? annee) : annee,
  }));

  const roCritiques: RevueRoCritique[] = (roRes.data ?? []).map((r) => ({
    id: r.id,
    intitule: r.intitule,
    criticite: r.criticite,
    criticiteResiduelle: r.criticite_residuelle,
    statut: r.statut,
  }));

  return { actionsAnterieures, roCritiques };
}
