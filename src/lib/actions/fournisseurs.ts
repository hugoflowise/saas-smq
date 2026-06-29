"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const base = {
  nom: z.string().trim().min(2, "Nom requis."),
  categorie: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  criticite: z.enum(["faible", "moyenne", "critique"]),
  // La note et la date d'évaluation ne sont plus saisies ici : elles sont
  // posées exclusivement par le dialogue d'évaluation dédié. Champs gardés
  // optionnels pour compatibilité, mais ils ne sont jamais écrasés en édition.
  noteEvaluation: z.coerce.number().int().min(1).max(5).optional(),
  dateEvaluation: z.string().optional(),
  prochaineEvaluation: z.string().optional(),
  statut: z.enum(["actif", "inactif"]),
  commentaire: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

// Champs « identité » du fournisseur, indépendants de l'évaluation.
function basePayload(d: z.infer<typeof createSchema>) {
  return {
    nom: d.nom,
    categorie: d.categorie ?? null,
    contact: d.contact ?? null,
    criticite: d.criticite,
    prochaine_evaluation: d.prochaineEvaluation || null,
    statut: d.statut,
    commentaire: d.commentaire ?? null,
  };
}

// Note/date d'évaluation : seulement si explicitement fournies (rétro-compat).
// L'édition d'un fournisseur ne doit pas écraser une évaluation déjà posée.
function evaluationFields(d: z.infer<typeof createSchema>) {
  const fields: { note_evaluation?: number; date_evaluation?: string } = {};
  if (d.noteEvaluation !== undefined) fields.note_evaluation = d.noteEvaluation;
  if (d.dateEvaluation) fields.date_evaluation = d.dateEvaluation;
  return fields;
}

export async function createFournisseurAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("fournisseurs").insert({
    tenant_id: ctx.effectiveTenantId,
    ...basePayload(parsed.data),
    ...evaluationFields(parsed.data),
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fournisseurs");
  return { ok: true };
}

export async function updateFournisseurAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("fournisseurs")
    .update({
      ...basePayload(parsed.data),
      ...evaluationFields(parsed.data),
      updated_by: ctx.userId,
    })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fournisseurs");
  return { ok: true };
}

export async function deleteFournisseurAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("fournisseurs", id);
  if (r.ok) revalidatePath("/fournisseurs");
  return r;
}

// ── Évaluations datées (historique §8.4.1) ──────────────────────────────────

const evaluationSchema = z.object({
  fournisseurId: z.string().uuid(),
  dateEvaluation: z.string().min(1, "Date d'évaluation requise."),
  noteGlobale: z.coerce.number().int().min(1).max(5),
  // Notes par critère : clé du critère → note 1-5 (critères côté code).
  notesCriteres: z.record(z.string(), z.coerce.number().int().min(1).max(5)).default({}),
  commentaire: z.string().trim().optional(),
  prochaineEvaluation: z.string().optional(),
});

/**
 * Enregistre une (ré)évaluation fournisseur :
 *  (a) ajoute une ligne d'HISTORIQUE dans `fournisseur_evaluations` (note globale
 *      + notes par critère + date), preuve de la surveillance périodique ;
 *  (b) met à jour le fournisseur (note_evaluation, date_evaluation,
 *      prochaine_evaluation) pour refléter la dernière évaluation.
 */
export async function enregistrerEvaluationFournisseurAction(
  input: unknown,
): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = evaluationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  const supabase = await createClient();

  const { error: insertError } = await supabase.from("fournisseur_evaluations").insert({
    tenant_id: ctx.effectiveTenantId,
    fournisseur_id: d.fournisseurId,
    date_evaluation: d.dateEvaluation,
    note_globale: d.noteGlobale,
    notes_criteres: d.notesCriteres,
    commentaire: d.commentaire ?? null,
    created_by: ctx.userId,
  });
  if (insertError) return { ok: false, error: insertError.message };

  const { error: updateError } = await supabase
    .from("fournisseurs")
    .update({
      note_evaluation: d.noteGlobale,
      date_evaluation: d.dateEvaluation,
      prochaine_evaluation: d.prochaineEvaluation || null,
      updated_by: ctx.userId,
    })
    .eq("id", d.fournisseurId)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/fournisseurs");
  return { ok: true };
}
