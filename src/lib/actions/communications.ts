"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const base = {
  sujet: z.string().trim().min(2, "Sujet requis."),
  type: z.enum(["note_interne", "communique", "affichage", "reunion", "newsletter", "autre"]),
  canal: z.enum(["email", "intranet", "affichage", "reunion", "courrier", "autre"]),
  audience: z.string().trim().optional(),
  message: z.string().trim().optional(),
  datePrevue: z.string().optional(),
  dateRealisee: z.string().optional(),
  statut: z.enum(["planifiee", "realisee"]),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    sujet: d.sujet,
    type: d.type,
    canal: d.canal,
    audience: d.audience ?? null,
    message: d.message ?? null,
    date_prevue: d.datePrevue || null,
    date_realisee: d.dateRealisee || null,
    statut: d.statut,
  };
}

export async function createCommunicationAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("communications")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true };
}

export async function updateCommunicationAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("communications")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true };
}
