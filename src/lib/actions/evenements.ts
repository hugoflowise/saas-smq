"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const createSchema = z.object({
  titre: z.string().trim().min(2, "Titre requis."),
  dateEvenement: z.string().min(1, "Date requise."),
  description: z.string().trim().optional(),
});

export async function createEvenementAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("evenements_qualite").insert({
    tenant_id: ctx.effectiveTenantId,
    titre: parsed.data.titre,
    date_evenement: parsed.data.dateEvenement,
    description: parsed.data.description ?? null,
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendrier");
  return { ok: true };
}

export async function deleteEvenementAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("evenements_qualite")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendrier");
  return { ok: true };
}
