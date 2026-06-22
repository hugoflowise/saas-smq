"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

// Chaque case SWOT/PESTEL est une liste de points (chaînes).
const liste = z.array(z.string());
const contexteSchema = z.object({
  swot: z.object({
    forces: liste,
    faiblesses: liste,
    opportunites: liste,
    menaces: liste,
  }),
  pestel: z.object({
    politique: liste,
    economique: liste,
    sociologique: liste,
    technologique: liste,
    ecologique: liste,
    legal: liste,
  }),
  dateRevue: z.string().optional(),
  prochainRevue: z.string().optional(),
});

export async function saveContexteAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = contexteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("contexte_organisme").upsert(
    {
      tenant_id: ctx.effectiveTenantId,
      analyse_swot: d.swot as Json,
      analyse_pestel: d.pestel as Json,
      date_revue: d.dateRevue || null,
      prochain_revue: d.prochainRevue || null,
      updated_by: ctx.userId,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/contexte");
  return { ok: true };
}
