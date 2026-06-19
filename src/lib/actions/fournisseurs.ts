"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

const base = {
  nom: z.string().trim().min(2, "Nom requis."),
  categorie: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  criticite: z.enum(["faible", "moyenne", "critique"]),
  noteEvaluation: z.coerce.number().int().min(1).max(5).optional(),
  dateEvaluation: z.string().optional(),
  prochaineEvaluation: z.string().optional(),
  statut: z.enum(["actif", "inactif"]),
  commentaire: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    nom: d.nom,
    categorie: d.categorie ?? null,
    contact: d.contact ?? null,
    criticite: d.criticite,
    note_evaluation: d.noteEvaluation ?? null,
    date_evaluation: d.dateEvaluation || null,
    prochaine_evaluation: d.prochaineEvaluation || null,
    statut: d.statut,
    commentaire: d.commentaire ?? null,
  };
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
  const { error } = await supabase
    .from("fournisseurs")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
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
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fournisseurs");
  return { ok: true };
}

export async function deleteFournisseurAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("fournisseurs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/fournisseurs");
  return { ok: true };
}
