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
  type: string;
  piloteId: string;
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
  ficheRedacteur: string;
  ficheVerificateur: string;
  ficheVersion: string;
  ficheNoteRevision: string;
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
  isApproved: boolean;
  users: FicheUser[];
} | null> {
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("processus")
    .select(
      "id, nom, type, entrees, sorties, date_derniere_revue, date_prochaine_revue, ressources_humaines, ressources_materielles, ressources_logicielles, ressources_financieres, ressources_documentaires, pilote_id, finalite, perimetre, referentiels, fiche_version, fiche_redacteur, fiche_verificateur, fiche_approuvee_par, fiche_approuvee_le, fiche_note_revision",
    )
    .eq("id", id)
    .eq("tenant_id", tid)
    .maybeSingle();
  if (!p) return null;

  const [
    tenantRes,
    activitesRes,
    interactionsRes,
    indicateursRes,
    risquesRes,
    proceduresRes,
    docsRes,
  ] = await Promise.all([
    supabase
      .from("tenants")
      .select(
        "nom_societe, logo_url, forme_juridique, siret, adresse, code_postal, ville, mentions_legales, couleur_charte",
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
      .select("nom, cible, unite, sens, formule_calcul, frequence_mesure")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("nom"),
    supabase
      .from("risques_opportunites")
      .select("intitule, criticite, type")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("criticite", { ascending: false }),
    supabase
      .from("procedures")
      .select("titre")
      .eq("tenant_id", tid)
      .eq("processus_id", id)
      .order("titre"),
    supabase
      .from("documents_maitrise")
      .select("code, titre, type")
      .eq("processus_id", id)
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("titre"),
  ]);

  const personIds = [p.pilote_id, p.fiche_approuvee_par].filter(Boolean) as string[];
  const { data: persons } = personIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", personIds)
    : { data: [] };
  const nameById = new Map((persons ?? []).map((x) => [x.id, nomPersonne(x.full_name, x.email)]));

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

  const typeLabel = TYPE_LABELS[p.type] ?? p.type;
  const risques = risquesRes.data ?? [];

  const data: FicheProcessusData = {
    societe: tenantRes.data as Societe,
    nom: p.nom,
    typeLabel,
    piloteName: p.pilote_id ? (nameById.get(p.pilote_id) ?? null) : null,
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
      nom: ind.nom,
      cible: cibleAffichee(ind.cible, ind.sens, ind.unite),
      formule: ind.formule_calcul,
      frequence: FREQUENCE_LABELS[ind.frequence_mesure] ?? ind.frequence_mesure,
    })),
    risques: risques.filter((r) => r.type === "risque"),
    opportunites: risques.filter((r) => r.type !== "risque"),
    documents: [
      ...(proceduresRes.data ?? []).map((pr) => ({
        reference: null,
        intitule: pr.titre,
        type: "Procédure",
      })),
      ...(docsRes.data ?? []).map((d) => ({ reference: d.code, intitule: d.titre, type: d.type })),
    ],
    version: p.fiche_version,
    redacteur: p.fiche_redacteur,
    verificateur: p.fiche_verificateur,
    approbateur: p.fiche_approuvee_par ? (nameById.get(p.fiche_approuvee_par) ?? null) : null,
    approuveeLe: p.fiche_approuvee_le,
    noteRevision: p.fiche_note_revision,
    genereLe: formatDate(todayISO()),
  };

  const initial: FicheInitialData = {
    id: p.id,
    nom: p.nom,
    type: p.type,
    piloteId: p.pilote_id ?? "",
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
    ficheRedacteur: p.fiche_redacteur ?? "",
    ficheVerificateur: p.fiche_verificateur ?? "",
    ficheVersion: p.fiche_version ?? "",
    ficheNoteRevision: p.fiche_note_revision ?? "",
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

  return { data, initial, isApproved: Boolean(p.fiche_approuvee_par), users: usersList };
}
