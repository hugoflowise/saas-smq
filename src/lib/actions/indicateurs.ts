"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const baseSchema = z.object({
  nom: z.string().trim().min(2, "Nom requis."),
  description: z.string().trim().optional(),
  processusId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["numeric", "percentage", "count", "duration"]),
  unite: z.string().trim().optional(),
  formule: z.string().trim().optional(),
  cible: z.coerce.number().optional(),
  sens: z.enum(["hausse", "baisse"]),
  frequence: z.enum(["quotidien", "hebdo", "mensuel", "trimestriel", "annuel"]),
});

export async function createIndicateurAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("indicateurs").insert({
    tenant_id: ctx.effectiveTenantId,
    nom: d.nom,
    description: d.description ?? null,
    processus_id: d.processusId ? d.processusId : null,
    type: d.type,
    unite: d.unite ?? null,
    formule_calcul: d.formule ?? null,
    cible: d.cible ?? null,
    sens: d.sens,
    frequence_mesure: d.frequence,
    source: "manuel",
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/indicateurs");
  return { ok: true };
}

const updateSchema = baseSchema.extend({ id: z.string().uuid() });

export async function updateIndicateurAction(input: unknown): Promise<ActionResult> {
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
    .from("indicateurs")
    .update({
      nom: d.nom,
      description: d.description ?? null,
      processus_id: d.processusId ? d.processusId : null,
      type: d.type,
      unite: d.unite ?? null,
      formule_calcul: d.formule ?? null,
      cible: d.cible ?? null,
      sens: d.sens,
      frequence_mesure: d.frequence,
      updated_by: ctx.userId,
    })
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/indicateurs/${d.id}`);
  revalidatePath("/indicateurs");
  return { ok: true };
}

const valeurSchema = z.object({
  indicateurId: z.string().uuid(),
  valeur: z.coerce.number(),
  dateMesure: z.string().optional(),
  commentaire: z.string().trim().optional(),
});

export async function addValeurAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = valeurSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Valeur invalide." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("indicateurs_valeurs").insert({
    tenant_id: ctx.effectiveTenantId,
    indicateur_id: d.indicateurId,
    valeur: d.valeur,
    date_mesure: d.dateMesure || todayISO(),
    commentaire: d.commentaire ?? null,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/indicateurs/${d.indicateurId}`);
  revalidatePath("/indicateurs");
  return { ok: true };
}

/** Met un indicateur à la corbeille (soft-delete, réversible). */
export async function deleteIndicateurAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("indicateurs", id);
  if (r.ok) revalidatePath("/indicateurs");
  return r;
}
