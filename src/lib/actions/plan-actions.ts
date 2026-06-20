"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

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
  ]),
  type: z.enum(["preventive", "corrective"]),
  priorite: z.enum(["p1", "p2", "p3"]),
  statut: z.enum(["a_faire", "en_cours", "termine", "bloquee", "abandonnee"]),
  processusConcerne: z.string().uuid().optional(),
  datePrevue: z.string().optional(),
  indicateurEfficacite: z.string().trim().optional(),
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

const createSchema = z.object(baseSchema);
const updateSchema = z.object({ id: z.string().uuid(), ...baseSchema });

/** Génère une référence ACT-AAAA-NNN par tenant et par année. */
async function nextReference(
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
  const reference = await nextReference(supabase, ctx.effectiveTenantId);

  const { error } = await supabase.from("actions").insert({
    tenant_id: ctx.effectiveTenantId,
    reference,
    description_courte: d.descriptionCourte,
    description_detail: d.descriptionDetail ?? null,
    origine: d.origine,
    type: d.type,
    priorite: d.priorite,
    statut: d.statut,
    processus_concerne: d.processusConcerne ?? null,
    date_prevue: d.datePrevue || null,
    indicateur_efficacite: d.indicateurEfficacite ?? null,
    commentaires: d.commentaires ?? null,
    constat: d.constat ?? null,
    cause_fondamentale: d.causeFondamentale ?? null,
    recommandation: d.recommandation ?? null,
    cotation: d.cotation ?? null,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/actions");
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
      date_effective:
        parsed.data.statut === "termine" ? new Date().toISOString().slice(0, 10) : null,
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
    patch.date_effective = d.statut === "termine" ? new Date().toISOString().slice(0, 10) : null;
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("actions")
    .update({
      description_courte: d.descriptionCourte,
      description_detail: d.descriptionDetail ?? null,
      origine: d.origine,
      type: d.type,
      priorite: d.priorite,
      statut: d.statut,
      processus_concerne: d.processusConcerne ?? null,
      date_prevue: d.datePrevue || null,
      date_effective: d.statut === "termine" ? new Date().toISOString().slice(0, 10) : null,
      indicateur_efficacite: d.indicateurEfficacite ?? null,
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
  return { ok: true };
}
