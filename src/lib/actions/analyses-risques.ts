"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CreateResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant-context";
import { softDeleteRow } from "./soft-delete";

const BASE = "/sst/analyses-risques";

// ---- En-tête de l'analyse (une par mission) ----

const headerSchema = z.object({
  intitule: z.string().trim().min(2, "Intitulé requis."),
  mission: z.string().trim().optional(),
  lieu: z.string().trim().optional(),
  dateAnalyse: z.string().optional(),
  dateRevision: z.string().optional(),
  statut: z.enum(["brouillon", "validee", "a_reviser", "archivee"]),
  pdpReference: z.string().trim().optional(),
  pdpLien: z.string().trim().optional(),
  pdpDateSignature: z.string().optional(),
  notes: z.string().trim().optional(),
});

function normalizeHeader(d: z.infer<typeof headerSchema>) {
  return {
    intitule: d.intitule,
    mission: d.mission || null,
    lieu: d.lieu || null,
    date_analyse: d.dateAnalyse || null,
    date_revision: d.dateRevision || null,
    statut: d.statut,
    // MASE : le plan de prévention est toujours requis (pas un choix).
    pdp_requis: true,
    pdp_reference: d.pdpReference || null,
    pdp_lien: d.pdpLien || null,
    pdp_date_signature: d.pdpDateSignature || null,
    notes: d.notes || null,
  };
}

export async function createAdrAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Sélectionnez d'abord un client." };

  const parsed = headerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses_risques")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      ...normalizeHeader(parsed.data),
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Création impossible." };
  revalidatePath(BASE);
  return { ok: true, id: data.id };
}

const updateHeaderSchema = headerSchema.extend({ id: z.string().uuid() });

export async function updateAdrAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateHeaderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const { id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("analyses_risques")
    .update({ ...normalizeHeader(rest), updated_by: ctx.userId })
    .eq("id", id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(BASE);
  revalidatePath(`${BASE}/${id}`);
  return { ok: true };
}

export async function deleteAdrAction(id: string): Promise<ActionResult> {
  const r = await softDeleteRow("analyses_risques", id);
  if (r.ok) revalidatePath(BASE);
  return r;
}

// ---- Lignes : situations de travail (phases) et leur cotation ----

const ligneSchema = z.object({
  analyseId: z.string().uuid(),
  tache: z.string().trim().min(2, "Tâche / situation requise."),
  domaine: z.enum(["securite", "sante", "environnement"]),
  danger: z.string().trim().optional(),
  gravite: z.coerce.number().int().min(1).max(4),
  probabilite: z.coerce.number().int().min(1).max(4),
  mesuresPrevention: z.string().trim().optional(),
  risqueResiduel: z.string().trim().optional(),
});

function normalizeLigne(d: z.infer<typeof ligneSchema>) {
  return {
    tache: d.tache,
    domaine: d.domaine,
    danger: d.danger || null,
    gravite: d.gravite,
    probabilite: d.probabilite,
    mesures_prevention: d.mesuresPrevention || null,
    risque_residuel: d.risqueResiduel || null,
  };
}

export async function addLigneAction(input: unknown): Promise<CreateResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = ligneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  // Ordre = fin de liste (nombre de lignes existantes).
  const { count } = await supabase
    .from("analyses_risques_lignes")
    .select("id", { count: "exact", head: true })
    .eq("analyse_id", d.analyseId)
    .eq("tenant_id", ctx.effectiveTenantId);

  const { data, error } = await supabase
    .from("analyses_risques_lignes")
    .insert({
      tenant_id: ctx.effectiveTenantId,
      analyse_id: d.analyseId,
      ordre: count ?? 0,
      ...normalizeLigne(d),
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Ajout impossible." };
  revalidatePath(`${BASE}/${d.analyseId}`);
  return { ok: true, id: data.id };
}

const updateLigneSchema = ligneSchema.extend({ id: z.string().uuid() });

export async function updateLigneAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = updateLigneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("analyses_risques_lignes")
    .update({ ...normalizeLigne(d), updated_by: ctx.userId })
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`${BASE}/${d.analyseId}`);
  return { ok: true };
}

const deleteLigneSchema = z.object({ id: z.string().uuid(), analyseId: z.string().uuid() });

export async function deleteLigneAction(input: unknown): Promise<ActionResult> {
  const ctx = await getTenantContext();
  if (!ctx.userId) return { ok: false, error: "Non authentifié." };
  if (!ctx.effectiveTenantId) return { ok: false, error: "Aucun client actif." };

  const parsed = deleteLigneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ligne introuvable." };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("analyses_risques_lignes")
    .delete()
    .eq("id", d.id)
    .eq("tenant_id", ctx.effectiveTenantId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`${BASE}/${d.analyseId}`);
  return { ok: true };
}
