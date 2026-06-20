"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const base = {
  reference: z.string().trim().optional(),
  nom: z.string().trim().min(1, "Nom requis."),
  prenom: z.string().trim().optional(),
  entite: z.string().trim().optional(),
  poste: z.string().trim().optional(),
  dateDemarrage: z.string().optional(),
  dateFin: z.string().optional(),
  odm: z.coerce.boolean().optional(),
  pdp: z.coerce.boolean().optional(),
  visiteMedicale: z.coerce.boolean().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    reference: d.reference ?? null,
    nom: d.nom,
    prenom: d.prenom ?? null,
    entite: d.entite ?? null,
    poste: d.poste ?? null,
    date_demarrage: d.dateDemarrage || null,
    date_fin: d.dateFin || null,
    odm: d.odm ?? false,
    pdp: d.pdp ?? false,
    visite_medicale: d.visiteMedicale ?? false,
  };
}

export async function createConsultantAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultants")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/effectif");
  return { ok: true };
}

export async function updateConsultantAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultants")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/effectif");
  return { ok: true };
}

export async function deleteConsultantAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/effectif");
  return { ok: true };
}
