"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
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
  typeAudit: z.enum(["interne", "externe", "fournisseur"]).default("interne"),
  organisme: z.string().trim().optional(),
  perimetre: z.string().trim().optional(),
  processusAudites: z.array(z.string().uuid()).optional(),
  datePrevue: z.string().optional(),
  dateRealisee: z.string().optional(),
  dureePrevue: z.coerce.number().optional(),
  statut: z.enum(["planifie", "en_cours", "realise", "rapport_redige", "cloture"]),
  rapport: z.string().trim().optional(),
  ecartsConstates: z.string().trim().optional(),
};
const auditCreate = z.object(auditBase);
const auditUpdate = z.object({ id: z.string().uuid(), ...auditBase });

/** Préfixe de référence selon le type d'audit. */
const AUDIT_PREFIX: Record<string, string> = {
  interne: "AI",
  externe: "AE",
  fournisseur: "AF",
};

function auditPayload(d: z.infer<typeof auditCreate>) {
  return {
    type_audit: d.typeAudit,
    organisme: d.organisme ?? null,
    perimetre: d.perimetre ?? null,
    processus_audites:
      d.processusAudites && d.processusAudites.length > 0 ? d.processusAudites : null,
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
  const prefix = `${AUDIT_PREFIX[parsed.data.typeAudit]}-${year}-`;
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

// ---------------------------------------------- Grille d'audit (questions)
const COTATIONS = [
  "non_evalue",
  "conforme",
  "point_fort",
  "point_attention",
  "nc_mineure",
  "nc_majeure",
  "non_applicable",
] as const;

const addQuestionSchema = z.object({
  auditId: z.string().uuid(),
  question: z.string().trim().min(2, "Question requise."),
  referenceIso: z.string().trim().optional(),
});

export async function addAuditQuestionAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = addQuestionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const { count } = await c.supabase
    .from("audit_questions")
    .select("id", { count: "exact", head: true })
    .eq("audit_id", d.auditId);

  const { error } = await c.supabase.from("audit_questions").insert({
    tenant_id: c.tenantId,
    audit_id: d.auditId,
    question: d.question,
    reference_iso: d.referenceIso ?? null,
    ordre: count ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/audits/${d.auditId}`);
  return { ok: true };
}

const updateQuestionSchema = z.object({
  id: z.string().uuid(),
  auditId: z.string().uuid(),
  reponse: z.enum(COTATIONS).optional(),
  constat: z.string().trim().optional(),
});

export async function updateAuditQuestionAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = updateQuestionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const d = parsed.data;

  const patch: Database["public"]["Tables"]["audit_questions"]["Update"] = {};
  if (d.reponse !== undefined) patch.reponse = d.reponse;
  if (d.constat !== undefined) patch.constat = d.constat || null;

  const { error } = await c.supabase
    .from("audit_questions")
    .update(patch)
    .eq("id", d.id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath : édition inline, on garde la ligne en place.
  return { ok: true };
}

export async function deleteAuditQuestionAction(
  id: string,
  auditId: string,
): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const { error } = await c.supabase
    .from("audit_questions")
    .delete()
    .eq("id", id)
    .eq("tenant_id", c.tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

/** Initialise le programme annuel : 1 audit interne planifié par processus. */
export async function generateAuditProgrammeAction(annee: number): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };

  const { data: processus } = await c.supabase
    .from("processus")
    .select("id, nom")
    .eq("tenant_id", c.tenantId)
    .order("ordre_affichage", { ascending: true });
  if (!processus || processus.length === 0) {
    return { ok: false, error: "Aucun processus à auditer. Créez d'abord la cartographie." };
  }

  const prefix = `AI-${annee}-`;
  const { count } = await c.supabase
    .from("audits_internes")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", c.tenantId)
    .ilike("reference", `${prefix}%`);

  const rows = processus.map((p, i) => ({
    tenant_id: c.tenantId,
    reference: `${prefix}${String((count ?? 0) + i + 1).padStart(3, "0")}`,
    type_audit: "interne" as const,
    perimetre: p.nom,
    processus_audites: [p.id],
    statut: "planifie" as const,
    created_by: c.userId,
  }));

  const { error } = await c.supabase.from("audits_internes").insert(rows);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/audits");
  return { ok: true };
}

// ---------------------------------------------- Écarts d'audit -> actions
const createActionFromAudit = z.object({
  auditId: z.string().uuid(),
  descriptionCourte: z.string().trim().min(2, "Description requise."),
  priorite: z.enum(["p1", "p2", "p3"]),
  datePrevue: z.string().optional(),
});

export async function createActionFromAuditAction(input: unknown): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const parsed = createActionFromAudit.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalide." };
  const d = parsed.data;

  const year = new Date().getFullYear();
  const prefix = `ACT-${year}-`;
  const { count } = await c.supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", c.tenantId)
    .ilike("reference", `${prefix}%`);
  const reference = `${prefix}${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: action, error: actionError } = await c.supabase
    .from("actions")
    .insert({
      tenant_id: c.tenantId,
      reference,
      description_courte: d.descriptionCourte,
      origine: "audit_interne",
      type: "corrective",
      priorite: d.priorite,
      date_prevue: d.datePrevue || null,
      statut: "a_faire",
      created_by: c.userId,
    })
    .select("id")
    .single();
  if (actionError || !action) {
    return { ok: false, error: `Création de l'action impossible : ${actionError?.message}` };
  }

  const { error: linkError } = await c.supabase
    .from("audit_actions")
    .insert({ tenant_id: c.tenantId, audit_id: d.auditId, action_id: action.id });
  if (linkError) return { ok: false, error: linkError.message };

  revalidatePath(`/audits/${d.auditId}`);
  revalidatePath("/actions");
  return { ok: true };
}

export async function unlinkAuditActionAction(
  auditId: string,
  actionId: string,
): Promise<ActionResult> {
  const c = await tenantWrite();
  if (!c) return { ok: false, error: "Aucun client actif." };
  const { error } = await c.supabase
    .from("audit_actions")
    .delete()
    .eq("tenant_id", c.tenantId)
    .eq("audit_id", auditId)
    .eq("action_id", actionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/audits/${auditId}`);
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
