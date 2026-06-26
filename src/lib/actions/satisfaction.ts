"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const base = {
  client: z.string().trim().optional(),
  dateReponse: z.string().optional(),
  noteRecommandation: z.coerce.number().int().min(0).max(10).optional(),
  noteSatisfaction: z.coerce.number().min(0).max(10).optional(),
  commentaire: z.string().trim().optional(),
  estReclamation: z.coerce.boolean().optional(),
  source: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    client: d.client ?? null,
    date_reponse: d.dateReponse || todayISO(),
    note_recommandation: d.noteRecommandation ?? null,
    note_satisfaction: d.noteSatisfaction ?? null,
    commentaire: d.commentaire ?? null,
    est_reclamation: d.estReclamation ?? false,
    source: d.source ?? null,
  };
}

export async function createEnqueteAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("enquetes_satisfaction")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/satisfaction");
  return { ok: true };
}

export async function updateEnqueteAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("enquetes_satisfaction")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/satisfaction");
  return { ok: true };
}

export async function deleteEnqueteAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("enquetes_satisfaction", id);
  if (r.ok) revalidatePath("/satisfaction");
  return r;
}
