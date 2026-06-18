"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

type ActionResult = { ok: true } | { ok: false; error: string };

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  return { supabase: await createClient(), tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

// --------------------------------------------------------------- Audits
const auditBase = {
  perimetre: z.string().trim().optional(),
  datePrevue: z.string().optional(),
  dateRealisee: z.string().optional(),
  dureePrevue: z.coerce.number().optional(),
  statut: z.enum(["planifie", "en_cours", "realise", "rapport_redige", "cloture"]),
  rapport: z.string().trim().optional(),
  ecartsConstates: z.string().trim().optional(),
};
const auditCreate = z.object(auditBase);
const auditUpdate = z.object({ id: z.string().uuid(), ...auditBase });

function auditPayload(d: z.infer<typeof auditCreate>) {
  return {
    perimetre: d.perimetre ?? null,
    date_prevue: d.datePrevue || null,
    date_realisee: d.dateRealisee || null,
    duree_prevue: d.dureePrevue ?? null,
    statut: d.statut,
    rapport: d.rapport ?? null,
    ecarts_constates: d.ecartsConstates ?? null,
  };
}

export async function createAuditAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = auditCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };

  const year = new Date().getFullYear();
  const prefix = `AI-${year}-`;
  const { count } = await c.supabase
    .from("audits_internes")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", c.tenantId)
    .ilike("reference", `${prefix}%`);
  const reference = `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { error } = await c.supabase.from("audits_internes").insert({
    tenant_id: c.tenantId,
    reference,
    ...auditPayload(parsed.data),
    created_by: c.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/audits");
  return { ok: true };
}

export async function updateAuditAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = auditUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("audits_internes")
    .update({ ...auditPayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/audits");
  return { ok: true };
}

// --------------------------------------------------------------- Revues
const revueBase = {
  annee: z.coerce.number().int().min(2000).max(2100),
  dateRealisation: z.string().optional(),
  statut: z.enum(["planifiee", "realisee", "cloturee"]),
  ordreDuJour: z.string().trim().optional(),
  conclusions: z.string().trim().optional(),
  decisions: z.string().trim().optional(),
};
const revueCreate = z.object(revueBase);
const revueUpdate = z.object({ id: z.string().uuid(), ...revueBase });

function revuePayload(d: z.infer<typeof revueCreate>) {
  return {
    annee: d.annee,
    date_realisation: d.dateRealisation || null,
    statut: d.statut,
    ordre_du_jour: d.ordreDuJour ?? null,
    conclusions: d.conclusions ?? null,
    decisions: d.decisions ?? null,
  };
}

export async function createRevueAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = revueCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("revues_direction")
    .insert({ tenant_id: c.tenantId, ...revuePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/revues/direction");
  return { ok: true };
}

export async function updateRevueAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = revueUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("revues_direction")
    .update({ ...revuePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/revues/direction");
  return { ok: true };
}
