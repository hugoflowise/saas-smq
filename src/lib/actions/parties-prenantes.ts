"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  return { supabase: await createClient(), tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

// ----------------------------------------------------------------- Partie prenante
const partieBase = {
  nom: z.string().trim().min(2, "Nom requis."),
  sphere: z.enum(["interne", "externe"]),
  type: z.enum(["client", "fournisseur", "collaborateur", "autorite", "actionnaire", "autre"]),
  niveauInteraction: z.enum(["faible", "moyenne", "forte", "elevee"]),
  pouvoir: z.coerce.number().int().min(1).max(3),
  legitimite: z.coerce.number().int().min(1).max(3),
  urgence: z.coerce.number().int().min(1).max(3),
};
const partieCreate = z.object(partieBase);
const partieUpdate = z.object({ id: z.string().uuid(), ...partieBase });

function partiePayload(d: z.infer<typeof partieCreate>) {
  return {
    nom: d.nom,
    sphere: d.sphere,
    type: d.type,
    niveau_interaction: d.niveauInteraction,
    pouvoir: d.pouvoir,
    legitimite: d.legitimite,
    urgence: d.urgence,
  };
}

export async function createPartieAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = partieCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("parties_interessees")
    .insert({ tenant_id: c.tenantId, ...partiePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}

export async function updatePartieAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = partieUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("parties_interessees")
    .update({ ...partiePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/parties-prenantes");
  revalidatePath(`/strategie/parties-prenantes/${parsed.data.id}`);
  return { ok: true };
}

export async function deletePartieAction(id: string): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const { error } = await c.supabase
    .from("parties_interessees")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}

// ----------------------------------------------------------------- Attente
const attenteBase = {
  partieId: z.string().uuid(),
  attente: z.string().trim().min(2, "Attente requise."),
  risque: z.string().trim().optional(),
  opportunite: z.string().trim().optional(),
  maitrise: z.enum(["maitrise", "partiel", "non_maitrise"]),
  moyensMaitrise: z.string().trim().optional(),
  processusId: z.string().uuid().optional(),
  integrationPa: z.coerce.boolean().optional(),
  action: z.string().trim().optional(),
  commentaire: z.string().trim().optional(),
};
const attenteCreate = z.object(attenteBase);
const attenteUpdate = z.object({ id: z.string().uuid(), ...attenteBase });

function attentePayload(d: z.infer<typeof attenteCreate>) {
  return {
    partie_id: d.partieId,
    attente: d.attente,
    risque: d.risque ?? null,
    opportunite: d.opportunite ?? null,
    maitrise: d.maitrise,
    moyens_maitrise: d.moyensMaitrise ?? null,
    processus_id: d.processusId ?? null,
    integration_pa: d.integrationPa ?? false,
    action: d.action ?? null,
    commentaire: d.commentaire ?? null,
  };
}

export async function createAttenteAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = attenteCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("pi_attentes")
    .insert({ tenant_id: c.tenantId, ...attentePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/strategie/parties-prenantes/${parsed.data.partieId}`);
  return { ok: true };
}

export async function updateAttenteAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = attenteUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("pi_attentes")
    .update({ ...attentePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/strategie/parties-prenantes/${parsed.data.partieId}`);
  return { ok: true };
}

export async function deleteAttenteAction(id: string, partieId: string): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const { error } = await c.supabase
    .from("pi_attentes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/strategie/parties-prenantes/${partieId}`);
  return { ok: true };
}
