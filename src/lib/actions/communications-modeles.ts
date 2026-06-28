"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const base = {
  categorie: z.string().trim().min(1),
  titre: z.string().trim().min(2, "Titre requis."),
  objet: z.string().trim().min(2, "Objet requis."),
  corps: z.string().default(""),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

export async function createModeleAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communication_modeles")
    .insert({ tenant_id: ctx.effectiveTenantId, ...parsed.data, created_by: ctx.userId })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath("/communications");
  return { ok: true, id: data.id };
}

export async function updateModeleAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("communication_modeles")
    .update({ ...rest, updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true };
}

export async function deleteModeleAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("communication_modeles", id);
  if (r.ok) revalidatePath("/communications");
  return r;
}

/** Journalise une communication envoyée (traçabilité ISO §7.4). */
export async function logCommunicationEnvoyeeAction(input: {
  sujet: string;
  audience: string;
  message?: string;
}): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const sujet = (input.sujet ?? "").trim();
  if (sujet.length < 2) return { ok: false, error: "Sujet manquant." };

  const supabase = await createClient();
  const { error } = await supabase.from("communications").insert({
    tenant_id: ctx.effectiveTenantId,
    sujet,
    type: "communique",
    canal: "email",
    audience: input.audience || null,
    message: input.message ?? null,
    statut: "realisee",
    date_realisee: todayISO(),
    created_by: ctx.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/communications");
  return { ok: true };
}
