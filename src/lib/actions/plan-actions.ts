"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

type ActionUpdate = Database["public"]["Tables"]["actions"]["Update"];

const baseSchema = {
  descriptionCourte: z.string().trim().min(2, "Description requise."),
  descriptionDetail: z.string().trim().optional(),
  origine: z.enum([
    "manuelle",
    "demarrage_smq",
    "audit_interne",
    "audit_externe",
    "nc",
    "rdd",
    "r_o",
    "reclamation",
    "amelioration_continue",
    "reunion",
    "dysfonctionnement",
    "incident",
    "accident",
    "objectif",
  ]),
  type: z.enum(["preventive", "corrective"]),
  priorite: z.enum(["p1", "p2", "p3"]),
  statut: z.enum(["a_faire", "en_cours", "termine", "bloquee", "abandonnee"]),
  processusConcerne: z.string().uuid().optional(),
  // §6.2.2 : objectif qualité auquel cette action contribue (lien direct).
  objectifId: z.string().uuid().optional(),
  revueId: z.string().uuid().optional(),
  datePrevue: z.string().optional(),
  indicateurEfficacite: z.string().trim().optional(),
  resultatEfficacite: z.string().trim().optional(),
  // §10.2 - quand et avec quel résultat l'efficacité de l'action a été vérifiée.
  dateVerificationEfficacite: z.string().optional(),
  resultatVerification: z.string().trim().optional(),
  commentaires: z.string().trim().optional(),
  constat: z.string().trim().optional(),
  causeFondamentale: z.string().trim().optional(),
  recommandation: z.string().trim().optional(),
  cotation: z
    .enum([
      "non_evalue",
      "conforme",
      "point_fort",
      "point_attention",
      "nc_mineure",
      "nc_majeure",
      "non_applicable",
    ])
    .optional(),
};

// NC liée créée en même temps que l'action (miroir de la case « créer une action »
// du formulaire de NC). Champs facultatifs : on retombe sur des valeurs déduites
// de l'action (intitulé, processus). Type/gravité/origine par défaut raisonnables.
const actionNcSchema = z.object({
  gravite: z.enum(["mineure", "majeure", "critique"]).optional(),
  type: z.enum(["nc_produit", "nc_processus", "reclamation_client"]).optional(),
  origine: z
    .enum(["audit_interne", "audit_externe", "client", "collaborateur", "rdd", "autre"])
    .optional(),
});

const createSchema = z.object({
  ...baseSchema,
  creerNc: z.boolean().optional(),
  nc: actionNcSchema.optional(),
});
const updateSchema = z.object({ id: z.string().uuid(), ...baseSchema });

/** Génère une référence ACT-AAAA-NNN par tenant et par année. */
export async function nextActionReference(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACT-${year}-`;
  const { count } = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .ilike("reference", `${prefix}%`);
  return `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function createActionAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) {
    return { ok: false, error: "Sélectionnez d'abord un client (tenant actif)." };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const reference = await nextActionReference(supabase, ctx.effectiveTenantId);

  // §6.2.2 : si une action est rattachée à un objectif sans origine explicite
  // (origine laissée sur « manuelle » par défaut), on la classe « objectif ».
  // De même, si on crée une NC liée sans origine explicite, on classe « nc ».
  const origine =
    d.objectifId && d.origine === "manuelle"
      ? "objectif"
      : d.creerNc && d.origine === "manuelle"
        ? "nc"
        : d.origine;

  const { data: act, error } = await supabase
    .from("actions")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      reference,
      description_courte: d.descriptionCourte,
      description_detail: d.descriptionDetail ?? null,
      origine,
      type: d.type,
      priorite: d.priorite,
      statut: d.statut,
      processus_concerne: d.processusConcerne ?? null,
      objectif_id: d.objectifId ?? null,
      revue_id: d.revueId ?? null,
      date_prevue: d.datePrevue || null,
      indicateur_efficacite: d.indicateurEfficacite ?? null,
      resultat_efficacite: d.resultatEfficacite ?? null,
      date_verification_efficacite: d.dateVerificationEfficacite || null,
      resultat_verification: d.resultatVerification ?? null,
      commentaires: d.commentaires ?? null,
      constat: d.constat ?? null,
      cause_fondamentale: d.causeFondamentale ?? null,
      recommandation: d.recommandation ?? null,
      cotation: d.cotation ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !act) return { ok: false, error: error?.message ?? "Création impossible." };

  // Non-conformité liée dans le registre des NC (case cochée dans le formulaire).
  // On déduit l'intitulé et la description de l'action ; le processus est repris.
  // La NC démarre au statut « action définie » puisqu'une action existe déjà.
  if (d.creerNc) {
    const nc = d.nc ?? {};
    const year = new Date().getFullYear();
    const prefix = `NC-${year}-`;
    const { count } = await supabase
      .from("non_conformites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.effectiveTenantId)
      .ilike("reference", `${prefix}%`);
    const ncRef = `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;

    const { data: ncRow, error: ncErr } = await supabase
      .from("non_conformites")
      .insert({
        tenant_id: ctx.effectiveTenantId,
        reference: ncRef,
        intitule: d.descriptionCourte,
        description: d.constat ?? d.descriptionDetail ?? null,
        date_constat: todayISO(),
        origine: nc.origine ?? "autre",
        gravite: nc.gravite ?? "mineure",
        type: nc.type ?? "nc_processus",
        statut: "action_definie",
        processus_concerne: d.processusConcerne ?? null,
        created_by: ctx.userId,
      })
      .select("id")
      .single();
    if (ncErr) return { ok: false, error: ncErr.message };
    if (ncRow) {
      await supabase.from("nc_actions").insert({
        tenant_id: ctx.effectiveTenantId,
        nc_id: ncRow.id,
        action_id: act.id,
      });
    }
    revalidatePath("/nc");
  }

  revalidatePath("/actions");
  if (d.revueId) revalidatePath(`/revues/direction/${d.revueId}`);
  if (d.objectifId) revalidatePath("/strategie/objectifs");
  return { ok: true };
}

const setStatutSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["a_faire", "en_cours", "termine", "bloquee", "abandonnee"]),
});

/** Change uniquement le statut d'une action (utilisé par le Kanban). */
export async function setActionStatutAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = setStatutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("actions")
    .update({
      statut: parsed.data.statut,
      date_effective: parsed.data.statut === "termine" ? todayISO() : null,
      updated_by: ctx.userId,
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/actions");
  return { ok: true };
}

const quickUpdateSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["a_faire", "en_cours", "termine", "bloquee", "abandonnee"]).optional(),
  priorite: z.enum(["p1", "p2", "p3"]).optional(),
  datePrevue: z.string().optional(),
  cotation: z
    .enum([
      "non_evalue",
      "conforme",
      "point_fort",
      "point_attention",
      "nc_mineure",
      "nc_majeure",
      "non_applicable",
    ])
    .optional(),
});

/** Mise à jour rapide d'un seul champ depuis le tableau (édition inline). */
export async function quickUpdateActionAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = quickUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const patch: ActionUpdate = { updated_by: ctx.userId };
  if (d.statut !== undefined) {
    patch.statut = d.statut;
    patch.date_effective = d.statut === "termine" ? todayISO() : null;
  }
  if (d.priorite !== undefined) patch.priorite = d.priorite;
  if (d.datePrevue !== undefined) patch.date_prevue = d.datePrevue || null;
  if (d.cotation !== undefined) patch.cotation = d.cotation;

  const supabase = await createClient();
  const { error } = await supabase
    .from("actions")
    .update(patch)
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath : on garde la ligne en place (pas de re-tri immédiat).
  return { ok: true };
}

export async function updateActionAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const origine = d.objectifId && d.origine === "manuelle" ? "objectif" : d.origine;

  const supabase = await createClient();
  const { error } = await supabase
    .from("actions")
    .update({
      description_courte: d.descriptionCourte,
      description_detail: d.descriptionDetail ?? null,
      origine,
      type: d.type,
      priorite: d.priorite,
      statut: d.statut,
      processus_concerne: d.processusConcerne ?? null,
      objectif_id: d.objectifId ?? null,
      date_prevue: d.datePrevue || null,
      date_effective: d.statut === "termine" ? todayISO() : null,
      indicateur_efficacite: d.indicateurEfficacite ?? null,
      resultat_efficacite: d.resultatEfficacite ?? null,
      date_verification_efficacite: d.dateVerificationEfficacite || null,
      resultat_verification: d.resultatVerification ?? null,
      commentaires: d.commentaires ?? null,
      constat: d.constat ?? null,
      cause_fondamentale: d.causeFondamentale ?? null,
      recommandation: d.recommandation ?? null,
      cotation: d.cotation ?? null,
      updated_by: ctx.userId,
    })
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/actions");
  if (d.objectifId) revalidatePath("/strategie/objectifs");
  return { ok: true };
}

// §6.2.2 : création rapide d'une action de mise en œuvre, liée à un objectif.
const createForObjectifSchema = z.object({
  objectifId: z.string().uuid(),
  descriptionCourte: z.string().trim().min(2, "Description requise."),
  priorite: z.enum(["p1", "p2", "p3"]),
  datePrevue: z.string().optional(),
});

/** Crée une action « objectif » rattachée à un objectif qualité et la lie. */
export async function createActionForObjectifAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = createForObjectifSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  const supabase = await createClient();
  const reference = await nextActionReference(supabase, ctx.effectiveTenantId);

  const { error } = await supabase.from("actions").insert({
    tenant_id: ctx.effectiveTenantId,
    reference,
    description_courte: d.descriptionCourte,
    origine: "objectif",
    type: "preventive",
    priorite: d.priorite,
    statut: "a_faire",
    objectif_id: d.objectifId,
    date_prevue: d.datePrevue || null,
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/actions");
  revalidatePath("/strategie/objectifs");
  return { ok: true };
}

/** Met une action du plan d'action à la corbeille (soft-delete, réversible). */
export async function deleteActionAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("actions", id);
  if (r.ok) revalidatePath("/actions");
  return r;
}
