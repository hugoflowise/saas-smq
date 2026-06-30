"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/actions/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

async function tenantWrite() {
  const ctx = await getTenantContext();
  if (!ctx.userId || !ctx.effectiveTenantId) return null;
  const supabase = await createClient();
  return { supabase, tenantId: ctx.effectiveTenantId, userId: ctx.userId };
}

// ----------------------------------------------------------- Unités de travail
const uniteBase = {
  libelle: z.string().trim().min(2, "Libellé requis."),
  description: z.string().trim().optional(),
  effectifConcerne: z.coerce.number().int().min(0).optional(),
  ordre: z.coerce.number().int().optional(),
};
const uniteCreate = z.object(uniteBase);
const uniteUpdate = z.object({ id: z.string().uuid(), ...uniteBase });

function unitePayload(d: z.infer<typeof uniteCreate>) {
  return {
    libelle: d.libelle,
    description: d.description ?? null,
    effectif_concerne: d.effectifConcerne ?? null,
    ordre: d.ordre ?? 0,
  };
}

export async function createUniteAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = uniteCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("duerp_unites_travail")
    .insert({ tenant_id: c.tenantId, ...unitePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/duerp");
  return { ok: true };
}

export async function updateUniteAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = uniteUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("duerp_unites_travail")
    .update({ ...unitePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/duerp");
  return { ok: true };
}

/** Met une unité de travail à la corbeille (ses risques la suivent en cascade DB). */
export async function deleteUniteAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("duerp_unites_travail", id);
  if (r.ok) revalidatePath("/duerp");
  return r;
}

// ---------------------------------------------------------------------- Risques
const cote = z.coerce.number().int().min(1).max(4);
const coteOpt = z
  .union([z.literal(""), cote])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const risqueBase = {
  uniteId: z.string().uuid(),
  familleId: z
    .union([z.literal(""), z.string().uuid()])
    .optional()
    .transform((v) => (v ? v : null)),
  danger: z.string().trim().min(2, "Danger requis."),
  situationExposition: z.string().trim().optional(),
  graviteBrute: cote,
  frequenceBrute: cote,
  mesuresExistantes: z.string().trim().optional(),
  graviteResiduelle: coteOpt,
  frequenceResiduelle: coteOpt,
  statut: z.enum(["a_traiter", "en_cours", "maitrise"]),
};
const risqueCreate = z.object(risqueBase);
const risqueUpdate = z.object({ id: z.string().uuid(), ...risqueBase });

function risquePayload(d: z.infer<typeof risqueCreate>) {
  return {
    unite_id: d.uniteId,
    famille_id: d.familleId,
    danger: d.danger,
    situation_exposition: d.situationExposition ?? null,
    gravite_brute: d.graviteBrute,
    frequence_brute: d.frequenceBrute,
    mesures_existantes: d.mesuresExistantes ?? null,
    gravite_residuelle: d.graviteResiduelle,
    frequence_residuelle: d.frequenceResiduelle,
    statut: d.statut,
  };
}

export async function createRisqueAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Sélectionnez d'abord un client." };
  const parsed = risqueCreate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("duerp_risques")
    .insert({ tenant_id: c.tenantId, ...risquePayload(parsed.data), created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/duerp");
  return { ok: true };
}

export async function updateRisqueAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = risqueUpdate.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("duerp_risques")
    .update({ ...risquePayload(parsed.data), updated_by: c.userId })
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/duerp");
  return { ok: true };
}

const risqueQuickSchema = z.object({
  id: z.string().uuid(),
  statut: z.enum(["a_traiter", "en_cours", "maitrise"]),
});

/** Mise à jour rapide du statut d'un risque depuis le tableau (édition inline). */
export async function quickUpdateRisqueAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = risqueQuickSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const patch: Database["public"]["Tables"]["duerp_risques"]["Update"] = {
    statut: parsed.data.statut,
    updated_by: c.userId,
  };
  const { error } = await c.supabase
    .from("duerp_risques")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath : on garde la ligne en place.
  return { ok: true };
}

export async function deleteRisqueAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("duerp_risques", id);
  if (r.ok) revalidatePath("/duerp");
  return r;
}

// ------------------------------------------------------------------- Familles
const familleSchema = z.object({
  id: z.string().uuid().optional(),
  libelle: z.string().trim().min(2, "Libellé requis."),
});

export async function createFamilleAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = familleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const { error } = await c.supabase
    .from("duerp_familles")
    .insert({ tenant_id: c.tenantId, libelle: parsed.data.libelle, created_by: c.userId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/duerp");
  return { ok: true };
}

export async function deleteFamilleAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("duerp_familles", id);
  if (r.ok) revalidatePath("/duerp");
  return r;
}
