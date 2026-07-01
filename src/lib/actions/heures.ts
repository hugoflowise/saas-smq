"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const schema = z.object({
  annee: z.coerce.number().int().min(2000).max(2100),
  heures: z.coerce.number().min(0),
});

/**
 * Enregistre (ou met à jour) les heures travaillées d'une année, dénominateur
 * des taux de fréquence / gravité (MASE). Upsert sur (tenant_id, annee).
 */
export async function setHeuresTravailleesAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("heures_travaillees").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      annee: d.annee,
      heures: d.heures,
      updated_by: ctx.userId,
      created_by: ctx.userId,
    },
    { onConflict: "tenant_id,annee" },
  );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
