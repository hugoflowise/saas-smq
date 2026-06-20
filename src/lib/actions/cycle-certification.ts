"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

const base = {
  libelle: z.string().trim().min(2, "Libellé requis."),
  type: z.enum(["audit_blanc", "audit_certification", "audit_surveillance", "revue", "autre"]),
  dateJalon: z.string().optional(),
  statut: z.enum(["planifie", "realise"]),
  description: z.string().trim().optional(),
};
const createSchema = z.object(base);
const updateSchema = z.object({ id: z.string().uuid(), ...base });

function payload(d: z.infer<typeof createSchema>) {
  return {
    libelle: d.libelle,
    type: d.type,
    date_jalon: d.dateJalon || null,
    statut: d.statut,
    description: d.description ?? null,
  };
}

export async function createJalonAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("jalons_certification")
    .insert({ tenant_id: ctx.effectiveTenantId, ...payload(parsed.data), created_by: ctx.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/certification");
  return { ok: true };
}

export async function updateJalonAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("jalons_certification")
    .update({ ...payload(parsed.data), updated_by: ctx.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/certification");
  return { ok: true };
}

export async function deleteJalonAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("jalons_certification")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/certification");
  return { ok: true };
}
