"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import { REMONTEE_TYPE_LABELS } from "@/lib/labels";
import { canApprove } from "@/lib/permissions";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { nextActionReference } from "./plan-actions";
import { softDeleteRow } from "./soft-delete";

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  const supabase = await createClient();
  return { supabase, tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

// ------------------------------------------------------------------ Remontées
const recBase = {
  type: z.enum(["reclamation", "dysfonctionnement", "incident", "accident"]),
  objet: z.string().trim().min(2, "Objet requis."),
  client: z.string().trim().optional(),
  dateReception: z.string().optional(),
  canal: z.enum(["mail", "tel", "visio", "audit", "enquete", "autre"]),
  gravite: z.enum(["mineure", "majeure", "critique"]),
  description: z.string().trim().optional(),
  traitement: z.string().trim().optional(),
  statut: z.enum(["recue", "analysee", "traitee", "cloturee"]),
};
// Champs de l'action liée, saisis directement dans le formulaire de remontée
// (tout est facultatif : on retombe sur des valeurs déduites du sujet si vide).
const recActionSchema = z.object({
  descriptionCourte: z.string().trim().optional(),
  descriptionDetail: z.string().trim().optional(),
  type: z.enum(["preventive", "corrective"]).optional(),
  priorite: z.enum(["p1", "p2", "p3"]).optional(),
  datePrevue: z.string().optional(),
  processusConcerne: z.string().uuid().optional(),
});
// À la création seulement : générer (ou non) une action liée dans le plan.
const recCreate = z.object({
  ...recBase,
  creerAction: z.boolean().optional(),
  action: recActionSchema.optional(),
});
const recUpdate = z.object({ id: z.string().uuid(), ...recBase });

function recPayload(d: z.infer<typeof recCreate>) {
  return {
    type: d.type,
    objet: d.objet,
    client: d.client ?? null,
    date_reception: d.dateReception || todayISO(),
    canal: d.canal,
    gravite: d.gravite,
    description: d.description ?? null,
    traitement: d.traitement ?? null,
    statut: d.statut,
  };
}

export async function createReclamationAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = recCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const { data: rec, error } = await c.supabase
    .from("reclamations")
    .insert({ tenant_id: c.tenantId, ...recPayload(d), created_by: c.userId })
    .select("id")
    .single();
  if (error || !rec) return { ok: false, error: error?.message ?? "Création impossible." };

  // Action liée dans le plan d'actions (case cochée par défaut côté formulaire).
  // Les champs sont saisis dans le formulaire de remontée ; à défaut, on déduit
  // l'intitulé/priorité du sujet (objet + gravité).
  if (d.creerAction) {
    const a = d.action ?? {};
    const reference = await nextActionReference(c.supabase, c.tenantId);
    const { data: act, error: actErr } = await c.supabase
      .from("actions")
      .insert({
        tenant_id: c.tenantId,
        reference,
        description_courte:
          a.descriptionCourte?.trim() || `${REMONTEE_TYPE_LABELS[d.type]} : ${d.objet}`,
        description_detail: a.descriptionDetail ?? d.description ?? null,
        origine: d.type,
        type: a.type ?? "corrective",
        priorite:
          a.priorite ?? (d.gravite === "critique" ? "p1" : d.gravite === "majeure" ? "p2" : "p3"),
        statut: "a_faire",
        date_prevue: a.datePrevue || null,
        processus_concerne: a.processusConcerne ?? null,
        created_by: c.userId,
      })
      .select("id")
      .single();
    if (actErr) return { ok: false, error: actErr.message };
    if (act) {
      await c.supabase
        .from("reclamations")
        .update({ action_id: act.id })
        .eq("id", rec.id)
        .eq("tenant_id", c.tenantId);
    }
    revalidatePath("/actions");
  }

  revalidatePath("/reclamations");
  return { ok: true };
}

export async function updateReclamationAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = recUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("reclamations")
    .update({ ...recPayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/reclamations");
  return { ok: true };
}

const recQuickSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["recue", "analysee", "traitee", "cloturee"]).optional(),
  gravite: z.enum(["mineure", "majeure", "critique"]).optional(),
});

/** Mise à jour rapide d'une réclamation depuis le tableau (édition inline). */
export async function quickUpdateReclamationAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = recQuickSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const patch: Database["public"]["Tables"]["reclamations"]["Update"] = { updated_by: c.userId };
  if (d.statut !== undefined) patch.statut = d.statut;
  if (d.gravite !== undefined) patch.gravite = d.gravite;

  const { error } = await c.supabase
    .from("reclamations")
    .update(patch)
    .eq("id", d.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath : on garde la ligne en place (pas de re-tri immédiat).
  return { ok: true };
}

// ------------------------------------------------------------------- Veille
const veilleBase = {
  intitule: z.string().trim().min(2, "Intitulé requis."),
  reference: z.string().trim().optional(),
  domaine: z.enum(["travail", "qualite", "environnement", "securite", "rgpd", "autre"]),
  datePublication: z.string().optional(),
  dateApplication: z.string().optional(),
  impactSmq: z.string().trim().optional(),
  actionsAPrevoir: z.string().trim().optional(),
  lien: z.string().trim().optional(),
  statut: z.enum(["a_analyser", "analysee", "integree", "sans_objet"]),
};
const veilleCreate = z.object(veilleBase);
const veilleUpdate = z.object({ id: z.string().uuid(), ...veilleBase });

function veillePayload(d: z.infer<typeof veilleCreate>) {
  return {
    intitule: d.intitule,
    reference: d.reference ?? null,
    domaine: d.domaine,
    date_publication: d.datePublication || null,
    date_application: d.dateApplication || null,
    impact_smq: d.impactSmq ?? null,
    actions_a_prevoir: d.actionsAPrevoir ?? null,
    lien: d.lien ?? null,
    statut: d.statut,
  };
}

export async function createVeilleAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = veilleCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("veille_reglementaire")
    .insert({ tenant_id: c.tenantId, ...veillePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/veille");
  return { ok: true };
}

export async function updateVeilleAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = veilleUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("veille_reglementaire")
    .update({ ...veillePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/veille");
  return { ok: true };
}

/** Met une veille réglementaire à la corbeille (soft-delete, réversible). */
export async function deleteVeilleAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("veille_reglementaire", id);
  if (r.ok) revalidatePath("/veille");
  return r;
}

// ----------------------------------------------------------------- Objectifs
const objBase = {
  intitule: z.string().trim().min(2, "Intitulé requis."),
  description: z.string().trim().optional(),
  estSmart: z.coerce.boolean().optional(),
  cibleChiffree: z.string().trim().optional(),
  echeance: z.string().optional(),
  fonctionConcernee: z.string().trim().optional(),
  statut: z.enum(["actif", "atteint", "abandonne"]),
  valeurCible: z.coerce.number().optional(),
  valeurActuelle: z.coerce.number().optional(),
  unite: z.string().trim().optional(),
  sens: z.enum(["hausse", "baisse"]).optional(),
  processusId: z.string().uuid().optional(),
  indicateurId: z.string().uuid().optional(),
};
const objCreate = z.object(objBase);
const objUpdate = z.object({ id: z.string().uuid(), ...objBase });

function objPayload(d: z.infer<typeof objCreate>) {
  return {
    intitule: d.intitule,
    description: d.description ?? null,
    est_smart: d.estSmart ?? false,
    cible_chiffree: d.cibleChiffree ?? null,
    echeance: d.echeance || null,
    fonction_concernee: d.fonctionConcernee ?? null,
    statut: d.statut,
    valeur_cible: d.valeurCible ?? null,
    valeur_actuelle: d.valeurActuelle ?? null,
    unite: d.unite ?? null,
    sens: d.sens ?? "hausse",
    processus_id: d.processusId ?? null,
    indicateur_id: d.indicateurId ?? null,
  };
}

export async function createObjectifAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = objCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("objectifs_qualite")
    .insert({ tenant_id: c.tenantId, ...objPayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}

const objQuickSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["actif", "atteint", "abandonne"]).optional(),
  echeance: z.string().optional(),
  valeurActuelle: z.coerce.number().optional(),
});

/** Mise à jour rapide d'un objectif depuis le tableau (édition inline). */
export async function quickUpdateObjectifAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = objQuickSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const patch: Database["public"]["Tables"]["objectifs_qualite"]["Update"] = {
    updated_by: c.userId,
  };
  if (d.statut !== undefined) patch.statut = d.statut;
  if (d.echeance !== undefined) patch.echeance = d.echeance || null;
  if (d.valeurActuelle !== undefined) patch.valeur_actuelle = d.valeurActuelle;

  const { error } = await c.supabase
    .from("objectifs_qualite")
    .update(patch)
    .eq("id", d.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath : on garde la ligne en place (pas de re-tri immédiat).
  return { ok: true };
}

export async function updateObjectifAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = objUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("objectifs_qualite")
    .update({ ...objPayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}

const objValiderSchema = z.object({ id: z.string().uuid(), valider: z.boolean() });

/**
 * §6.2 : établissement / validation d'un objectif par la direction.
 * Pose (ou retire) la trace valide_par / valide_le. Réservé à un approbateur
 * (dirigeant ou admin Flowise) : c'est une preuve d'engagement de la direction.
 */
export async function validerObjectifAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canApprove(ctx.role)) {
    return { ok: false, error: "Seule la direction peut établir un objectif." };
  }

  const parsed = objValiderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const { id, valider } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("objectifs_qualite")
    .update({
      valide_par: valider ? ctx.userId : null,
      valide_le: valider ? new Date().toISOString() : null,
      updated_by: ctx.userId,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}
