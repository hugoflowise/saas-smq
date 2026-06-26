import type { Societe } from "@/components/document-paper";
import type { FicheProcessusData } from "@/components/fiche-processus";
import { formatDate, nomPersonne, todayISO } from "@/lib/format";
import { cibleAffichee, FREQUENCE_LABELS } from "@/lib/indicateurs";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  pilotage: "Pilotage",
  realisation: "Réalisation",
  support: "Support",
};

export type FicheInitialData = {
  id: string;
  nom: string;
  intituleLong: string;
  type: string;
  pilotes: { piloteId: string; piloteNom: string }[];
  dateDerniereRevue: string;
  dateProchaineRevue: string;
  finalite: string;
  perimetre: string;
  referentiels: string;
  entrees: string;
  sorties: string;
  ressourcesHumaines: string;
  ressourcesMaterielles: string;
  ressourcesLogicielles: string;
  ressourcesFinancieres: string;
  ressourcesDocumentaires: string;
  reference: string;
  activites: { activite: string; responsable: string; documents: string }[];
  interactions: { fournisseur: string; nature: string; client: string }[];
};

export type FicheUser = { id: string; nom: string };

/**
 * Charge et assemble toutes les données de la fiche d'identité d'un processus,
 * partagé par la page de détail et la version imprimable. Renvoie null si le
 * processus n'existe pas pour ce client.
 */
export async function loadFicheProcessusData(
  tid: string,
  id: string,
): Promise<{
  data: FicheProcessusData;
  initial: FicheInitialData;
  statut: string;
  isApproved: boolean;
  users: FicheUser[];
} | null> {
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("processus")
    .select(
      "id, nom, intitule_long, type, entrees, sorties, date_derniere_revue, date_prochaine_revue, ressources_humaines, ressources_materielles, ressources_logicielles, ressources_financieres, ressources_documentaires, pilote_id, pilote_nom, finalite, perimetre, referentiels, fiche_statut, fiche_reference, fiche_version, fiche_redige_par, fiche_soumis_par, fiche_soumis_le, fiche_approuvee_par, fiche_approuvee_le, fiche_publiee_le",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!p) return null;

  const [tenantRes, activitesRes, interactionsRes, indicateursRes, risquesRes, pilotesRes] =
    await Promise.all([
      supabase
        .from("tenants")
        .select(
          "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte, responsable_flowise_id",
        )
        .eq("id", tid)
        .maybeSingle(),
      supabase
        .from("processus_activites")
        .select("activite, responsable, documents")
        .eq("processus_id", id)
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .order("ordre"),
      supabase
        .from("processus_interactions")
        .select("fournisseur, nature, client")
        .eq("processus_id", id)
        .eq("tenant_id", tid)
        .is("deleted_at", null)
        .order("ordre"),
      supabase
        .from("indicateurs")
        .select("id, nom, cible, unite, sens, formule_calcul, frequence_mesure")
        .eq("tenant_id", tid)
        .eq("processus_id", id)
        .is("deleted_at", null)
        .order("nom"),
      supabase
        .from("risques_opportunites")
        .select("id, intitule, criticite, type")
        .eq("tenant_id", tid)
        .eq("processus_id", id)
        .is("deleted_at", null)
        .order("criticite", { ascending: false }),
      supabase
        .from("processus_pilotes")
        .select("pilote_id, pilote_nom, ordre")
        .eq("tenant_id", tid)
        .eq("processus_id", id)
        .is("deleted_at", null)
        .order("ordre"),
    ]);
  const pilotesRows = pilotesRes.data ?? [];

  const personIds = [
    ...pilotesRows.map((r) => r.pilote_id),
    p.fiche_redige_par,
    p.fiche_soumis_par,
    p.fiche_approuvee_par,
  ].filter(Boolean) as string[];
  const { data: persons } = personIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, signature_image")
        .in("id", personIds)
    : { data: [] };
  const nameById = new Map((persons ?? []).map((x) => [x.id, nomPersonne(x.full_name, x.email)]));
  const signatureById = new Map((persons ?? []).map((x) => [x.id, x.signature_image]));

  // Utilisateurs du client : pour sélectionner le pilote du processus.
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("tenant_id", tid)
    .order("full_name");
  const usersList = (users ?? []).map((u) => ({
    id: u.id,
    nom: nomPersonne(u.full_name, u.email),
  }));

  // Responsable Qualité Flowise rattaché (offre premium) : aussi pilote possible.
  const rqId = (tenantRes.data as { responsable_flowise_id?: string | null } | null)
    ?.responsable_flowise_id;
  if (rqId && !usersList.some((u) => u.id === rqId)) {
    const { data: rq } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", rqId)
      .maybeSingle();
    if (rq) {
      usersList.unshift({ id: rq.id, nom: `${nomPersonne(rq.full_name, rq.email)} (Flowise)` });
    }
  }

  const typeLabel = TYPE_LABELS[p.type] ?? p.type;
  const risques = risquesRes.data ?? [];

  // Pilotes affichés : un ou plusieurs, nom libre prioritaire sinon l'utilisateur lié.
  const piloteNoms = pilotesRows
    .map((r) =>
      r.pilote_nom?.trim() ? r.pilote_nom : r.pilote_id ? nameById.get(r.pilote_id) : null,
    )
    .filter(Boolean) as string[];
  const piloteName = piloteNoms.length ? piloteNoms.join(", ") : null;

  const data: FicheProcessusData = {
    societe: tenantRes.data as Societe,
    nom: p.nom,
    intituleLong: p.intitule_long,
    typeLabel,
    piloteName,
    finalite: p.finalite,
    perimetre: p.perimetre,
    referentiels: p.referentiels,
    entrees: p.entrees,
    sorties: p.sorties,
    ressources: [
      { type: "Humaines", detail: p.ressources_humaines },
      { type: "Matérielles", detail: p.ressources_materielles },
      { type: "Logicielles / SI", detail: p.ressources_logicielles },
      { type: "Financières", detail: p.ressources_financieres },
      { type: "Documentaires", detail: p.ressources_documentaires },
    ],
    activites: activitesRes.data ?? [],
    interactions: (interactionsRes.data ?? []).map((it) => ({
      fournisseur: it.fournisseur ?? "",
      nature: it.nature,
      client: it.client ?? "",
    })),
    indicateurs: (indicateursRes.data ?? []).map((ind) => ({
      id: ind.id,
      nom: ind.nom,
      cible: cibleAffichee(ind.cible, ind.sens, ind.unite),
      formule: ind.formule_calcul,
      frequence: FREQUENCE_LABELS[ind.frequence_mesure] ?? ind.frequence_mesure,
    })),
    risques: risques.filter((r) => r.type === "risque"),
    opportunites: risques.filter((r) => r.type !== "risque"),
    reference: p.fiche_reference,
    statut: p.fiche_statut,
    version: p.fiche_version,
    versionDate: p.fiche_publiee_le,
    redacteur: p.fiche_redige_par ? (nameById.get(p.fiche_redige_par) ?? null) : null,
    signatureRedacteur: p.fiche_redige_par ? (signatureById.get(p.fiche_redige_par) ?? null) : null,
    // Le rédacteur « signe » au moment où il soumet la fiche à approbation.
    redacteurSigneLe: p.fiche_soumis_le,
    verificateur: p.fiche_soumis_par ? (nameById.get(p.fiche_soumis_par) ?? null) : null,
    approbateur: p.fiche_approuvee_par ? (nameById.get(p.fiche_approuvee_par) ?? null) : null,
    signatureApprobateur: p.fiche_approuvee_par
      ? (signatureById.get(p.fiche_approuvee_par) ?? null)
      : null,
    approuveeLe: p.fiche_approuvee_le,
    genereLe: formatDate(todayISO()),
  };

  const initial: FicheInitialData = {
    id: p.id,
    nom: p.nom,
    intituleLong: p.intitule_long ?? "",
    type: p.type,
    pilotes: pilotesRows.map((r) => ({
      piloteId: r.pilote_id ?? "",
      piloteNom: r.pilote_nom ?? "",
    })),
    dateDerniereRevue: p.date_derniere_revue ?? "",
    dateProchaineRevue: p.date_prochaine_revue ?? "",
    finalite: p.finalite ?? "",
    perimetre: p.perimetre ?? "",
    referentiels: p.referentiels ?? "",
    entrees: p.entrees ?? "",
    sorties: p.sorties ?? "",
    ressourcesHumaines: p.ressources_humaines ?? "",
    ressourcesMaterielles: p.ressources_materielles ?? "",
    ressourcesLogicielles: p.ressources_logicielles ?? "",
    ressourcesFinancieres: p.ressources_financieres ?? "",
    ressourcesDocumentaires: p.ressources_documentaires ?? "",
    reference: p.fiche_reference ?? "",
    activites: (activitesRes.data ?? []).map((a) => ({
      activite: a.activite,
      responsable: a.responsable ?? "",
      documents: a.documents ?? "",
    })),
    interactions: (interactionsRes.data ?? []).map((it) => ({
      fournisseur: it.fournisseur ?? "",
      nature: it.nature ?? "",
      client: it.client ?? "",
    })),
  };

  return {
    data,
    initial,
    statut: p.fiche_statut,
    isApproved: Boolean(p.fiche_approuvee_par),
    users: usersList,
  };
}
