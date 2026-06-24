import type { Societe } from "@/components/document-paper";
import type { FicheProcessusData } from "@/components/fiche-processus";
import { formatDate, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  pilotage: "Pilotage",
  realisation: "Réalisation",
  support: "Support",
};

export type FicheInitialData = {
  id: string;
  finalite: string;
  perimetre: string;
  referentiels: string;
  entrees: string;
  sorties: string;
  ressources: string;
  ficheRedacteur: string;
  ficheVerificateur: string;
  ficheVersion: string;
  ficheNoteRevision: string;
  activites: { activite: string; responsable: string; documents: string }[];
  interactions: { sens: "entrant" | "sortant"; partenaire: string; nature: string }[];
};

/**
 * Charge et assemble toutes les données de la fiche d'identité d'un processus,
 * partagé par la page de détail et la version imprimable. Renvoie null si le
 * processus n'existe pas pour ce client.
 */
export async function loadFicheProcessusData(
  tid: string,
  id: string,
): Promise<{ data: FicheProcessusData; initial: FicheInitialData; isApproved: boolean } | null> {
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("processus")
    .select(
      "id, nom, type, entrees, sorties, ressources_associees, pilote_id, finalite, perimetre, referentiels, fiche_version, fiche_redacteur, fiche_verificateur, fiche_approuvee_par, fiche_approuvee_le, fiche_note_revision",
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
      .select("sens, partenaire, nature")
      .eq("processus_id", id)
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("ordre"),
    supabase
      .from("indicateurs")
      .select("nom, cible, unite")
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
  const nameById = new Map((persons ?? []).map((x) => [x.id, x.full_name ?? x.email]));

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
    ressources: p.ressources_associees,
    activites: activitesRes.data ?? [],
    interactions: interactionsRes.data ?? [],
    indicateurs: indicateursRes.data ?? [],
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
    finalite: p.finalite ?? "",
    perimetre: p.perimetre ?? "",
    referentiels: p.referentiels ?? "",
    entrees: p.entrees ?? "",
    sorties: p.sorties ?? "",
    ressources: p.ressources_associees ?? "",
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
      sens: it.sens,
      partenaire: it.partenaire,
      nature: it.nature ?? "",
    })),
  };

  return { data, initial, isApproved: Boolean(p.fiche_approuvee_par) };
}
