"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PartiesPrenantesSnapshot } from "@/app/(tenant)/strategie/parties-prenantes/parties-prenantes-snapshot";
import type { ActionResult } from "@/lib/actions/types";
import { prioriteFromTotal, scoreTotal } from "@/lib/parties-prenantes";
import { canWrite } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { versionIndex, versionLettre } from "@/lib/versions";
import { softDeleteRow } from "./soft-delete";

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
  const r = await softDeleteRow("parties_interessees", id);
  if (r.ok) revalidatePath("/strategie/parties-prenantes");
  return r;
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
  const r = await softDeleteRow("pi_attentes", id);
  if (r.ok) revalidatePath(`/strategie/parties-prenantes/${partieId}`);
  return r;
}

// ----------------------------------------------------- Référence + versions (DG_SMQ_005)

/** Enregistre la référence documentaire de la cartographie des parties prenantes. */
export async function savePartiesPrenantesReferenceAction(
  reference: string,
): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ parties_prenantes_reference: reference.trim() || null })
    .eq("id", ctx.effectiveTenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}

/**
 * Fige une version de la cartographie des parties prenantes : instantané de la
 * liste (cotation + priorité + nb d'attentes) + référence. Modèle léger sans
 * circuit d'approbation, comme la cartographie des processus.
 */
export async function publishPartiesPrenantesVersionAction(): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };
  const tid = ctx.effectiveTenantId;

  const supabase = await createClient();
  const [{ data: parties }, { data: attentes }, { data: tenant }] = await Promise.all([
    supabase
      .from("parties_interessees")
      .select("id, nom, sphere, type, niveau_interaction, pouvoir, legitimite, urgence")
      .eq("tenant_id", tid)
      .is("deleted_at", null)
      .order("nom"),
    supabase.from("pi_attentes").select("partie_id").eq("tenant_id", tid).is("deleted_at", null),
    supabase
      .from("tenants")
      .select("nom_societe, parties_prenantes_reference")
      .eq("id", tid)
      .maybeSingle(),
  ]);

  if (!parties || parties.length === 0) {
    return { ok: false, error: "Aucune partie prenante à figer." };
  }

  const attentesCount = new Map<string, number>();
  for (const a of attentes ?? []) {
    attentesCount.set(a.partie_id, (attentesCount.get(a.partie_id) ?? 0) + 1);
  }

  const snapshot: PartiesPrenantesSnapshot = {
    reference: tenant?.parties_prenantes_reference ?? null,
    societe: tenant?.nom_societe ?? null,
    parties: parties.map((p) => {
      const total = scoreTotal(p.pouvoir, p.legitimite, p.urgence);
      return {
        nom: p.nom,
        sphere: p.sphere,
        type: p.type,
        interaction: p.niveau_interaction,
        pouvoir: p.pouvoir,
        legitimite: p.legitimite,
        urgence: p.urgence,
        total,
        priorite: prioriteFromTotal(total),
        nbAttentes: attentesCount.get(p.id) ?? 0,
      };
    }),
  };

  const { data: existantes } = await supabase
    .from("parties_prenantes_versions")
    .select("version")
    .eq("tenant_id", tid);
  const maxIndex = (existantes ?? []).reduce((m, v) => Math.max(m, versionIndex(v.version)), -1);
  const version = versionLettre(maxIndex + 1);

  const { error } = await supabase.from("parties_prenantes_versions").insert({
    tenant_id: tid,
    version,
    snapshot: snapshot as unknown as Json,
    published_by: ctx.userId,
  });
  if (error) return { ok: false, error: `Publication impossible : ${error.message}` };

  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}

/** Supprime une version figée des parties prenantes (créée par erreur). */
export async function deletePartiesPrenantesVersionAction(id: string): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };
  if (!canWrite(ctx.role)) return { ok: false, error: "Droits insuffisants." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parties_prenantes_versions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId)
    .select("id");
  if (error) return { ok: false, error: `Suppression impossible : ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: "Suppression refusée (droits ou version introuvable)." };
  }

  revalidatePath("/strategie/parties-prenantes");
  return { ok: true };
}
