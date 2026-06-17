"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

const createProcessusSchema = z.object({
  nom: z.string().trim().min(2, "Nom requis."),
  type: z.enum(["pilotage", "realisation", "support"]),
  description: z.string().trim().optional(),
});

export async function createProcessusAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) {
    return { ok: false, error: "Sélectionnez d'abord un client (tenant actif)." };
  }

  const parsed = createProcessusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("processus").insert({
    tenant_id: ctx.effectiveTenantId,
    nom: parsed.data.nom,
    type: parsed.data.type,
    description: parsed.data.description ?? null,
    created_by: ctx.userId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/processus");
  return { ok: true };
}
