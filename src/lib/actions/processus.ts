"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

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

const updateProcessusSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().trim().min(2, "Nom requis."),
  type: z.enum(["pilotage", "realisation", "support"]),
  description: z.string().trim().optional(),
  entrees: z.string().trim().optional(),
  sorties: z.string().trim().optional(),
  dateDerniereRevue: z.string().optional(),
  dateProchaineRevue: z.string().optional(),
});

export async function updateProcessusAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateProcessusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("processus")
    .update({
      nom: data.nom,
      type: data.type,
      description: data.description ?? null,
      entrees: data.entrees ?? null,
      sorties: data.sorties ?? null,
      date_derniere_revue: data.dateDerniereRevue || null,
      date_prochaine_revue: data.dateProchaineRevue || null,
      updated_by: ctx.userId,
    })
    .eq("id", data.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/processus");
  revalidatePath(`/processus/${data.id}`);
  return { ok: true };
}

/** Met un processus à la corbeille (soft-delete, réversible). */
export async function deleteProcessusAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("processus", id);
  if (r.ok) {
    revalidatePath("/processus");
    revalidatePath("/documents");
  }
  return r;
}
